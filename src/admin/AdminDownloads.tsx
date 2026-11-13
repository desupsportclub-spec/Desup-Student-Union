/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DownloadItem, DownloadCategory, FileExtensionType } from '../types';
import { formatThaiDate } from '../lib/format';
import { CornerBracket } from '../components/common/Ornament';
import { saveDownloadWithChunks, deleteDownloadWithChunks, resolveDownloadUrl } from '../lib/downloadStorage';
import { DOWNLOAD_CATEGORIES, getDownloadCategoryLabel } from '../config/site';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';

export const AdminDownloads: React.FC = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DownloadCategory>('form');
  const [fileType, setFileType] = useState<FileExtensionType>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileSizeText, setFileSizeText] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'downloads'));
      const list: DownloadItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as DownloadItem);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDownloads(list);
    } catch (err) {
      console.warn("Could not fetch downloads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('form');
    setFileType('pdf');
    setFileUrl('');
    setSelectedFileName('');
    setFileSizeText('');
    setFileSizeBytes(0);
    setUploadMode('file');
    setUploadProgress(0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: DownloadItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setFileType(item.fileType);
    setFileUrl(item.fileUrl || '');
    setSelectedFileName(item.fileName || '');
    setFileSizeText(item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB` : '');
    setFileSizeBytes(item.fileSize || 0);
    setUploadMode(item.isChunked || item.fileUrl?.startsWith('data:') ? 'file' : 'url');
    setUploadProgress(0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    // Check size (max 15MB via chunked Firestore storage)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("ไฟล์มีขนาดใหญ่เกิน 15MB กรุณาเลือกไฟล์ที่เล็กลง หรือใช้การระบุลิงก์ภายนอก");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setFileType('pdf');
    else if (ext === 'docx' || ext === 'doc') setFileType('docx');
    else if (ext === 'xlsx' || ext === 'xls') setFileType('xlsx');

    setSelectedFileName(file.name);
    setFileSizeBytes(file.size);
    setFileSizeText(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg("ไม่สามารถอ่านไฟล์จากเครื่องได้ กรุณาลองใหม่อีกครั้ง");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const hasExistingChunkedFile = !!(editingItem?.isChunked && !fileUrl);
    if (!title.trim() || (!fileUrl.trim() && !hasExistingChunkedFile)) {
      setErrorMsg("กรุณาระบุชื่อเอกสารและเลือกไฟล์หรือระบุลิงก์");
      return;
    }

    setSaving(true);
    setUploadProgress(5);
    try {
      const id = editingItem?.id || doc(collection(db, 'downloads')).id;

      // If editing a chunked document without picking a new file, update metadata only by preserving chunks via resolved URL or re-saving metadata
      let finalFileUrl = fileUrl.trim();
      if (hasExistingChunkedFile && editingItem) {
        // Fetch chunks to keep existing file intact when only editing title/category
        const existingSnap = await getDocs(collection(db, 'downloads', id, 'chunks'));
        const parts: { index: number; data: string }[] = [];
        existingSnap.forEach((d) => parts.push(d.data() as { index: number; data: string }));
        parts.sort((a, b) => a.index - b.index);
        finalFileUrl = parts.map((p) => p.data).join('');
      }

      const meta: Omit<DownloadItem, 'id'> = {
        title: title.trim(),
        category,
        fileType,
        fileUrl: finalFileUrl,
        fileName: selectedFileName || editingItem?.fileName || '',
        fileSize: fileSizeBytes || editingItem?.fileSize || 0,
        downloads: editingItem?.downloads || 0,
        createdAt: editingItem?.createdAt || new Date().toISOString()
      };

      await saveDownloadWithChunks(id, meta, (pct) => setUploadProgress(pct));
      setIsModalOpen(false);
      await fetchDownloads();
      setSuccessModalTitle(editingItem ? 'แก้ไขเอกสารเรียบร้อยแล้ว' : 'บันทึกและอัปโหลดเอกสารเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save download failed:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกเอกสารลงฐานข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบเอกสาร "${itemTitle}" หรือไม่?`)) return;
    try {
      await deleteDownloadWithChunks(id);
      await fetchDownloads();
      setSuccessModalTitle('ลบเอกสารเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete download failed:", err);
    }
  };

  const handleAdminPreview = async (item: DownloadItem) => {
    if (!item.id) return;
    setPreviewingId(item.id);
    try {
      const resolved = await resolveDownloadUrl(item);
      const a = document.createElement('a');
      a.href = resolved.url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
            จัดการเอกสารดาวน์โหลด & ไฟล์ PDF
          </h1>
          <p className="text-xs text-[#1B1226]/60 mt-1">
            รองรับการอัปโหลดไฟล์ PDF จากเครื่องโดยตรง (สูงสุด 15MB) พร้อมระบบเปิดดูและพิมพ์ออนไลน์
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors shadow-sm self-start sm:self-auto"
          >
            + เพิ่มเอกสารใหม่
          </button>
        </div>
      </div>

      {/* Downloads Table */}
      <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">กำลังโหลดเอกสาร...</div>
        ) : downloads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">ชื่อเอกสาร</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">ชนิดไฟล์</th>
                  <th className="py-3 px-4">ดาวน์โหลด</th>
                  <th className="py-3 px-4">วันที่เผยแพร่</th>
                  <th className="py-3 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {downloads.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-medium text-[#1B1226]">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/70">
                      {getDownloadCategoryLabel(item.category)}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase font-bold text-[#9C7A2B]">
                      {item.fileType}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-numbers">
                      {item.downloads} ครั้ง
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/60">
                      {formatThaiDate(item.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleAdminPreview(item)}
                        disabled={previewingId === item.id}
                        className="text-[#9C7A2B] hover:underline font-medium"
                      >
                        {previewingId === item.id ? 'กำลังเปิด...' : 'พรีวิว'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-[#4B1F7A] hover:underline"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.title)}
                        className="text-[#9B1C31] hover:underline"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#1B1226]/60 space-y-3">
            <p>ยังไม่มีเอกสารในระบบ</p>
            <button
              onClick={handleOpenCreate}
              className="text-xs px-5 py-2.5 bg-[#4B1F7A] text-white rounded-sm hover:bg-[#2A1245]"
            >
              + เพิ่มเอกสารใหม่
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] rounded-sm border border-[#B8923A]/50 max-w-xl w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <div className="flex items-center justify-between border-b border-[#4B1F7A]/15 pb-3">
              <h2 className="font-serif text-lg font-semibold text-[#2A1245]">
                {editingItem ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร / อัปโหลดไฟล์ PDF'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-800 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border-l-2 border-[#9B1C31] text-xs text-[#9B1C31]">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block font-semibold text-[#2A1245] mb-1">ชื่อเอกสาร *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบฟอร์มขออนุมัติโครงการ (สธ.๐๑)"
                  className="w-full input-underline text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2A1245] mb-1">หมวดหมู่ *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DownloadCategory)}
                    className="w-full border border-stone-300 p-2 rounded-sm bg-white"
                  >
                    {DOWNLOAD_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2A1245] mb-1">ประเภทไฟล์ *</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as FileExtensionType)}
                    className="w-full border border-stone-300 p-2 rounded-sm font-mono uppercase bg-white"
                  >
                    <option value="pdf">PDF (เปิดอ่าน / พิมพ์ได้)</option>
                    <option value="docx">DOCX (Word)</option>
                    <option value="xlsx">XLSX (Excel)</option>
                  </select>
                </div>
              </div>

              {/* Upload Mode Selector */}
              <div className="pt-2">
                <div className="flex items-center gap-4 border-b border-stone-200 pb-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`pb-1 font-medium transition-colors ${
                      uploadMode === 'file'
                        ? 'border-b-2 border-[#B8923A] text-[#2A1245] font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    📁 อัปโหลดไฟล์จากเครื่อง (รองรับ PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`pb-1 font-medium transition-colors ${
                      uploadMode === 'url'
                        ? 'border-b-2 border-[#B8923A] text-[#2A1245] font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🔗 ระบุลิงก์ภายนอก (Google Drive / OneDrive)
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#4B1F7A]/30 hover:border-[#B8923A] p-5 rounded-sm bg-white/70 text-center cursor-pointer transition-colors"
                    >
                      <div className="text-2xl mb-1">📄</div>
                      <p className="font-medium text-[#2A1245]">
                        {selectedFileName ? selectedFileName : 'คลิกเพื่อเลือกไฟล์ PDF หรือเอกสารจากเครื่อง'}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {fileSizeText ? `ขนาด: ${fileSizeText}` : 'รองรับไฟล์ .pdf, .docx, .xlsx (ขนาดไม่เกิน 15MB)'}
                      </p>
                    </div>
                    {(fileUrl || editingItem?.isChunked) && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                        ✓ เตรียมไฟล์เรียบร้อย พร้อมจัดเก็บและเปิดอ่าน
                      </p>
                    )}
                    {saving && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4B1F7A] transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#4B1F7A] text-right font-mono">
                          กำลังจัดเก็บข้อมูล {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-[#2A1245] mb-1">
                      ลิงก์ไฟล์เอกสาร (URL) *
                    </label>
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf หรือ Google Drive"
                      className="w-full input-underline text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#4B1F7A]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-sm hover:bg-stone-50 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#4B1F7A] text-[#FAF7F0] rounded-sm hover:bg-[#2A1245] font-medium text-xs shadow-editorial disabled:opacity-60"
                >
                  {saving ? `กำลังบันทึก (${uploadProgress}%)...` : 'บันทึกเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessFeedbackModal
        open={!!successModalTitle}
        title={successModalTitle}
        onClose={() => setSuccessModalTitle('')}
      />
    </div>
  );
};
