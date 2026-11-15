/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DownloadItem } from '../types';
import { formatThaiDate, formatNumber } from '../lib/format';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { resolveDownloadUrl } from '../lib/downloadStorage';
import { DOWNLOAD_CATEGORIES, getDownloadCategoryLabel } from '../config/site';
import { getCachedDownloadsSync, loadDownloads } from '../lib/publicDataService';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'เอกสารทั้งหมด' },
  ...DOWNLOAD_CATEGORIES
];

export const Downloads: React.FC = () => {
  const initialDownloads = getCachedDownloadsSync();
  const [downloads, setDownloads] = useState<DownloadItem[]>(initialDownloads || []);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!initialDownloads);

  // PDF Viewer Modal State
  const [previewItem, setPreviewItem] = useState<DownloadItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewIsBlob, setPreviewIsBlob] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const pdfFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    loadDownloads((list) => {
      if (!active) return;
      setDownloads(list);
      setLoading(false);
    })
      .catch((err) => {
        console.warn('Could not load downloads:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Cleanup active Blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewIsBlob && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewIsBlob, previewUrl]);

  const handleDownloadCount = async (item: DownloadItem) => {
    if (!item.id) return;
    try {
      await updateDoc(doc(db, 'downloads', item.id), {
        downloads: increment(1)
      });
      setDownloads(prev =>
        prev.map(d => d.id === item.id ? { ...d, downloads: (d.downloads || 0) + 1 } : d)
      );
    } catch {
      // Ignore increment error
    }
  };

  const closePreview = () => {
    if (previewIsBlob && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewItem(null);
    setPreviewUrl('');
    setPreviewIsBlob(false);
    setPreviewError(null);
  };

  const openPreview = async (item: DownloadItem) => {
    if (previewIsBlob && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewItem(item);
    setPreviewUrl('');
    setPreviewIsBlob(false);
    setPreviewError(null);
    setPreviewLoading(true);

    try {
      const resolved = await resolveDownloadUrl(item);
      setPreviewUrl(resolved.url);
      setPreviewIsBlob(resolved.isBlob);
    } catch (err) {
      console.error('Could not resolve preview file:', err);
      setPreviewError('ไม่สามารถโหลดไฟล์เอกสารได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerDownload = async (item: DownloadItem, existingResolvedUrl?: string) => {
    if (!item.id) return;
    setDownloadingId(item.id);
    try {
      await handleDownloadCount(item);
      let targetUrl = existingResolvedUrl || '';
      let shouldRevoke = false;

      if (!targetUrl) {
        const resolved = await resolveDownloadUrl(item);
        targetUrl = resolved.url;
        shouldRevoke = resolved.isBlob;
      }

      const ext = item.fileType && !item.title.toLowerCase().endsWith(`.${item.fileType.toLowerCase()}`)
        ? `.${item.fileType.toLowerCase()}`
        : '';
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `${item.title}${ext}`;
      if (!shouldRevoke && !targetUrl.startsWith('blob:')) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(targetUrl), 10000);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = () => {
    if (!previewItem || !previewUrl) return;
    try {
      if (pdfFrameRef.current && pdfFrameRef.current.contentWindow) {
        pdfFrameRef.current.contentWindow.focus();
        pdfFrameRef.current.contentWindow.print();
      } else {
        const win = window.open(previewUrl, '_blank');
        win?.focus();
        win?.print();
      }
    } catch {
      window.open(previewUrl, '_blank');
    }
  };

  const filtered = downloads.filter((d) => {
    if (selectedCat !== 'all' && d.category !== selectedCat) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText="DOCUMENTS & FORMS" thText="ดาวน์โหลดเอกสารทางการ" />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226] mt-2">
            ศูนย์รวมเอกสารและแบบฟอร์ม
          </h1>
          <p className="text-xs md:text-sm text-[#1B1226]/70 mt-1">
            เปิดดูเอกสาร PDF แบบออนไลน์ พร้อมระบบดาวน์โหลดและสั่งพิมพ์เอกสารได้ทันที
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเอกสาร..."
            className="w-full text-xs input-underline"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-2 border-b border-[#4B1F7A]/10 text-xs font-medium">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`pb-2 whitespace-nowrap transition-colors relative ${
              selectedCat === cat.id
                ? 'text-[#4B1F7A] font-semibold'
                : 'text-[#1B1226]/60 hover:text-[#2A1245]'
            }`}
          >
            <span>{cat.label}</span>
            {selectedCat === cat.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B8923A]" />
            )}
          </button>
        ))}
      </div>

      {/* Editorial Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-stone-200/60 rounded-sm" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="border border-[#4B1F7A]/15 bg-[#FAF7F0] rounded-sm shadow-editorial overflow-hidden">
          {/* Mobile Card List (no horizontal table scrolling) */}
          <div className="md:hidden divide-y divide-[#4B1F7A]/10">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-base font-semibold text-[#1B1226] leading-snug">
                    {item.title}
                  </h3>
                  <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#B8923A]/60 rounded-sm text-[#9C7A2B] uppercase font-bold shrink-0">
                    {item.fileType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#1B1226]/65">
                  <span>{getDownloadCategoryLabel(item.category)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatThaiDate(item.createdAt, true)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openPreview(item)}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-[#B8923A] text-[#9C7A2B] hover:bg-[#EDE6F5] rounded-sm text-xs font-medium transition-colors"
                  >
                    <span>เปิดดู</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDownload(item)}
                    disabled={downloadingId === item.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4B1F7A] text-[#FAF7F0] hover:bg-[#2A1245] transition-colors rounded-sm text-xs font-medium shadow-editorial-sm disabled:opacity-60"
                  >
                    <span>{downloadingId === item.id ? 'กำลังเตรียม...' : 'ดาวน์โหลด'}</span>
                    <span className="text-[10px] opacity-75">({formatNumber(item.downloads)})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EDE6F5]/50 border-b border-[#4B1F7A]/15 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">ชื่อเอกสาร</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">ชนิดไฟล์</th>
                  <th className="py-3 px-4">วันที่เผยแพร่</th>
                  <th className="py-3 px-4 text-center">เปิดดู / พิมพ์ / ดาวน์โหลด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4B1F7A]/10">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#EDE6F5]/30 transition-colors">
                    <td className="py-4 px-4 font-serif text-sm font-semibold text-[#1B1226]">
                      {item.title}
                    </td>
                    <td className="py-4 px-4 text-[#1B1226]/70">
                      {getDownloadCategoryLabel(item.category)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-[#B8923A]/60 rounded-sm text-[#9C7A2B] uppercase font-bold">
                        {item.fileType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#1B1226]/60">
                      {formatThaiDate(item.createdAt, true)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Open Viewer Button */}
                        <button
                          type="button"
                          onClick={() => openPreview(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#B8923A] text-[#9C7A2B] hover:bg-[#EDE6F5] rounded-sm text-xs font-medium transition-colors"
                        >
                          <span>👁️ เปิดดู</span>
                        </button>

                        {/* Direct Download Button */}
                        <button
                          type="button"
                          onClick={() => triggerDownload(item)}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4B1F7A] text-[#FAF7F0] hover:bg-[#2A1245] transition-colors rounded-sm text-xs font-medium shadow-editorial-sm disabled:opacity-60"
                        >
                          <span>{downloadingId === item.id ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลด'}</span>
                          <span className="text-[10px] opacity-70">({formatNumber(item.downloads)})</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/40 space-y-2">
          <p className="font-serif text-lg text-[#2A1245]">
            {search ? `ไม่พบเอกสารที่ตรงกับ "${search}"` : 'ยังไม่มีเอกสารในหมวดหมู่นี้'}
          </p>
          <p className="text-xs text-[#1B1226]/60">
            เอกสารจะถูกจัดเก็บและเปิดให้ดาวน์โหลดผ่านหน้านี้เมื่อมีประกาศเพิ่มเติม
          </p>
        </div>
      )}

      {/* Inline PDF Viewer Modal with Download & Print */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#FAF7F0] border-2 border-[#B8923A] rounded-sm w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#4B1F7A]/20 flex items-center justify-between bg-white">
              <div className="pr-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C7A2B]">
                  {getDownloadCategoryLabel(previewItem.category)} · {previewItem.fileType.toUpperCase()}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#2A1245] line-clamp-1">
                  {previewItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close Preview"
                className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Embedded Viewer */}
            <div className="flex-1 bg-stone-900/5 p-2 overflow-hidden flex items-center justify-center min-h-[50vh]">
              {previewLoading ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#4B1F7A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#2A1245] font-medium">กำลังโหลดไฟล์เอกสารจากฐานข้อมูล...</p>
                </div>
              ) : previewError ? (
                <div className="p-12 text-center space-y-3 text-xs text-[#9B1C31]">
                  <p className="font-semibold">{previewError}</p>
                </div>
              ) : (previewItem.fileType === 'pdf' || previewUrl.startsWith('blob:') || previewItem.fileUrl.endsWith('.pdf')) && previewUrl ? (
                <iframe
                  ref={pdfFrameRef}
                  src={previewUrl}
                  title={previewItem.title}
                  className="w-full h-full min-h-[60vh] rounded-sm border border-stone-200 bg-white"
                />
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="text-4xl">📄</div>
                  <p className="font-serif text-base text-[#2A1245]">
                    ไฟล์ประเภท {previewItem.fileType.toUpperCase()} จำเป็นต้องดาวน์โหลดเพื่อเปิดในโปรแกรมเฉพาะทาง
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerDownload(previewItem, previewUrl)}
                    className="inline-block px-6 py-2.5 bg-[#4B1F7A] text-white rounded text-xs font-medium"
                  >
                    คลิกเพื่อดาวน์โหลดไฟล์
                  </button>
                </div>
              )}
            </div>

            {/* Modal Action Footer Toolbar */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#4B1F7A]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-[#1B1226]/60">
                เผยแพร่เมื่อ {formatThaiDate(previewItem.createdAt, true)} · ดาวน์โหลดแล้ว {previewItem.downloads} ครั้ง
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!previewUrl}
                  className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 border border-[#B8923A] text-[#2A1245] hover:bg-[#EDE6F5] rounded-sm font-medium transition-colors disabled:opacity-50"
                >
                  <span>🖨️</span>
                  <span>พิมพ์เอกสาร</span>
                </button>

                {/* Open in Full Window */}
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-sm text-stone-700 transition-colors"
                  >
                    <span>↗ เปิดหน้าต่างใหม่</span>
                  </a>
                )}

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => triggerDownload(previewItem, previewUrl)}
                  disabled={!previewUrl}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-[#4B1F7A] text-white hover:bg-[#2A1245] rounded-sm font-medium shadow-editorial transition-colors disabled:opacity-50"
                >
                  <span>⬇ ดาวน์โหลดไฟล์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
