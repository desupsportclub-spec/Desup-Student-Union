/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ComplaintItem, ComplaintStatus, PublicReply, ComplaintPrivateContact, ComplaintPrivateAttachment } from '../types';
import { formatThaiDateTime, formatThaiDate } from '../lib/format';
import { ComplaintStatusBadge } from '../components/common/StatusBadge';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { usePendingComplaints } from './ComplaintAlertsContext';
import { computeComplaintStats, syncComplaintStatsToSettings } from '../lib/complaintStatsSync';

export const AdminComplaints: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pendingCount } = usePendingComplaints();

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Selected Detail Modal
  const [activeComplaint, setActiveComplaint] = useState<ComplaintItem | null>(null);
  const [privateContact, setPrivateContact] = useState<ComplaintPrivateContact | null>(null);
  const [privateAttachments, setPrivateAttachments] = useState<ComplaintPrivateAttachment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ComplaintItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  const getComplaintDocId = (item: ComplaintItem) => item.id || item.trackingCode;

  const fetchComplaints = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'complaints'));
      const list: ComplaintItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ComplaintItem);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setComplaints(list);
      void syncComplaintStatsToSettings(computeComplaintStats(list));
    } catch (err) {
      console.warn("Could not load complaints:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComplaints(false);
  }, [fetchComplaints]);

  // Silently refresh list if live pending count updates while viewing complaints page
  useEffect(() => {
    if (!loading) {
      void fetchComplaints(true);
    }
  }, [pendingCount, fetchComplaints]);

  const handleOpenDetail = useCallback(async (item: ComplaintItem) => {
    const docId = getComplaintDocId(item);
    setActiveComplaint(item);
    setPrivateContact(null);
    setPrivateAttachments(null);
    setReplyText('');
    setErrorMsg(null);

    try {
      const contactSnap = await getDoc(doc(db, 'complaints', docId, 'private', 'contact'));
      if (contactSnap.exists()) {
        setPrivateContact(contactSnap.data() as ComplaintPrivateContact);
      }
    } catch {
      // Ignore
    }

    try {
      const attachSnap = await getDoc(doc(db, 'complaints', docId, 'private', 'attachments'));
      if (attachSnap.exists()) {
        setPrivateAttachments(attachSnap.data() as ComplaintPrivateAttachment);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Open specific complaint automatically when coming from ?open=<id>
  useEffect(() => {
    const openTarget = searchParams.get('open');
    if (!openTarget || complaints.length === 0) return;

    const found = complaints.find(
      (c) => c.id === openTarget || c.trackingCode === openTarget
    );
    if (found) {
      void handleOpenDetail(found);
      const next = new URLSearchParams(searchParams);
      next.delete('open');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, complaints, handleOpenDetail]);

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!activeComplaint) return;
    const docId = getComplaintDocId(activeComplaint);
    setUpdating(true);
    setErrorMsg(null);
    try {
      const ref = doc(db, 'complaints', docId);
      const now = new Date().toISOString();
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: now
      });

      setActiveComplaint(prev => prev ? { ...prev, status: newStatus, updatedAt: now } : null);
      setComplaints(prev => {
        const next = prev.map(c => getComplaintDocId(c) === docId ? { ...c, status: newStatus, updatedAt: now } : c);
        void syncComplaintStatsToSettings(computeComplaintStats(next));
        return next;
      });
      setSuccessModalTitle('ปรับปรุงสถานะเรื่องร้องเรียนเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Status update error:", err);
      setErrorMsg('ไม่สามารถอัปเดตสถานะเรื่องร้องเรียนได้ กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบ');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPublicReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !replyText.trim()) return;
    const docId = getComplaintDocId(activeComplaint);

    setUpdating(true);
    setErrorMsg(null);
    try {
      const ref = doc(db, 'complaints', docId);
      const now = new Date().toISOString();
      const newReply: PublicReply = {
        text: replyText.trim(),
        at: now,
        by: 'องค์การนักเรียน'
      };

      const updatedReplies = [...(activeComplaint.publicReplies || []), newReply];
      await updateDoc(ref, {
        publicReplies: updatedReplies,
        updatedAt: now
      });

      setActiveComplaint(prev => prev ? { ...prev, publicReplies: updatedReplies, updatedAt: now } : null);
      setComplaints(prev => prev.map(c => getComplaintDocId(c) === docId ? { ...c, publicReplies: updatedReplies, updatedAt: now } : c));
      setReplyText('');
      setSuccessModalTitle('ส่งข้อความตอบกลับสาธารณะเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Add reply error:", err);
      setErrorMsg('ไม่สามารถส่งข้อความตอบกลับได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDeleteComplaint = async () => {
    if (!deleteTarget) return;
    const item = deleteTarget;
    const docId = getComplaintDocId(item);

    setUpdating(true);
    setErrorMsg(null);
    try {
      // Remove private subcollection docs first (ignore if they don't exist)
      try {
        await deleteDoc(doc(db, 'complaints', docId, 'private', 'contact'));
      } catch {
        // Ignore
      }
      try {
        await deleteDoc(doc(db, 'complaints', docId, 'private', 'attachments'));
      } catch {
        // Ignore
      }

      await deleteDoc(doc(db, 'complaints', docId));
      setComplaints(prev => {
        const next = prev.filter(c => getComplaintDocId(c) !== docId);
        void syncComplaintStatsToSettings(computeComplaintStats(next));
        return next;
      });
      if (activeComplaint && getComplaintDocId(activeComplaint) === docId) {
        setActiveComplaint(null);
      }
      setDeleteTarget(null);
      setSuccessModalTitle(`ลบเรื่องร้องเรียนรหัส ${item.trackingCode || docId} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error("Delete complaint failed:", err);
      setDeleteTarget(null);
      setErrorMsg('ไม่สามารถลบเรื่องร้องเรียนได้ กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบหรือรีเฟรชหน้าแล้วลองใหม่');
    } finally {
      setUpdating(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (complaints.length === 0) return;

    const headers = ["TrackingCode", "Type", "Title", "Body", "Location", "Anonymous", "Status", "CreatedAt"];
    const rows = complaints.map(c => [
      `"${c.trackingCode}"`,
      `"${c.type}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      c.anonymous ? "Yes" : "No",
      `"${c.status}"`,
      `"${c.createdAt}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = complaints.filter(c => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.trackingCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
            ระบบรับเรื่องร้องเรียนและข้อเสนอแนะ
          </h1>
          <p className="text-xs text-[#1B1226]/60">
            พิจารณา ดำเนินการ ตอบกลับสาธารณะ และสืบค้นเรื่องร้องเรียนทั้งหมด
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white border border-[#B8923A] text-xs font-medium text-[#2A1245] hover:bg-[#FAF7F0] rounded-sm shadow-sm self-start sm:self-auto"
        >
          📥 ส่งออกเป็น CSV
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-[#9B1C31] flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-[#9B1C31] font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 border border-[#4B1F7A]/15 rounded-sm">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามหัวข้อ หรือรหัสติดตาม (SC-...)..."
            className="w-full text-xs input-underline"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">สถานะ:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border p-1.5 rounded-sm text-xs bg-white"
          >
            <option value="all">ทั้งหมด</option>
            <option value="received">รับเรื่องแล้ว</option>
            <option value="considering">กำลังพิจารณา</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="resolved">เสร็จสิ้นแล้ว</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">ประเภท:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border p-1.5 rounded-sm text-xs bg-white"
          >
            <option value="all">ทั้งหมด</option>
            <option value="complaint">เรื่องร้องเรียน</option>
            <option value="suggestion">ข้อเสนอแนะ</option>
            <option value="corruption">เบาะแสทุจริต</option>
            <option value="inquiry">สอบถาม</option>
            <option value="compliment">ชมเชย</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">กำลังโหลด...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">รหัสติดตาม</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">หัวข้อเรื่อง</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">ผู้ส่ง</th>
                  <th className="py-3 px-4">วันที่ส่ง</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#4B1F7A]">
                      {item.trackingCode}
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/70">
                      {item.type === 'complaint' ? 'ร้องเรียน' : item.type === 'suggestion' ? 'เสนอแนะ' : item.type === 'corruption' ? 'ทุจริต' : item.type === 'inquiry' ? 'สอบถาม' : 'อื่น ๆ'}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1B1226] max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4">
                      <ComplaintStatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/60">
                      {item.anonymous ? 'ไม่ระบุตัวตน' : 'ระบุตัวตน'}
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/60">
                      {formatThaiDate(item.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className="px-3 py-1 bg-[#4B1F7A] text-[#FAF7F0] rounded-sm hover:bg-[#2A1245] text-xs"
                      >
                        เปิดดู
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={updating}
                        className="px-2.5 py-1 bg-red-50 text-[#9B1C31] hover:bg-red-100 rounded-sm text-xs"
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
          <div className="p-12 text-center text-xs text-[#1B1226]/60">
            ไม่พบเรื่องร้องเรียนที่ตรงตามเงื่อนไข
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-[#B8923A]/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-editorial my-8">
            <div className="flex items-center justify-between border-b border-[#4B1F7A]/15 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#4B1F7A]">
                  รหัสติดตาม: {activeComplaint.trackingCode}
                </span>
                <h2 className="font-serif text-xl font-semibold text-[#2A1245] mt-1">
                  {activeComplaint.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-stone-400 hover:text-stone-800 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Status Change Selector */}
            <div className="p-4 bg-[#EDE6F5]/50 border border-[#B8923A]/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[#2A1245]">สถานะการดำเนินงานปัจจุบัน:</span>
              <div className="flex items-center gap-2">
                <select
                  value={activeComplaint.status}
                  onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                  disabled={updating}
                  className="p-1.5 border border-[#4B1F7A]/30 rounded-sm bg-white font-medium"
                >
                  <option value="received">รับเรื่องแล้ว</option>
                  <option value="considering">กำลังพิจารณา</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="resolved">ดำเนินการเสร็จสิ้น</option>
                </select>
                <ComplaintStatusBadge status={activeComplaint.status} />
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-2 text-xs leading-relaxed text-[#1B1226]">
              <span className="font-semibold text-[#4B1F7A] block">รายละเอียดเรื่อง:</span>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm whitespace-pre-wrap font-sans">
                {activeComplaint.body}
              </div>
              <div className="text-[11px] text-stone-500 pt-1">
                📍 สถานที่: {activeComplaint.location || 'ไม่ระบุ'} · ส่งเมื่อ: {formatThaiDateTime(activeComplaint.createdAt)}
              </div>
            </div>

            {/* Attached Photos (Private attachments) */}
            {privateAttachments?.images && privateAttachments.images.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <span className="text-xs font-semibold text-[#4B1F7A] block">
                  รูปถ่ายแนบประกอบ (ข้อมูลลับเฉพาะผู้ดูแล):
                </span>
                <div className="flex gap-4">
                  {privateAttachments.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-28 h-28 border rounded overflow-hidden bg-stone-100 block"
                    >
                      <img src={img.url} alt="แนบประกอบ" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submitter Contact Info (Private contact) */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-semibold text-[#4B1F7A] block">
                ข้อมูลผู้ส่งเรื่อง (ข้อมูลลับเฉพาะผู้ดูแล):
              </span>
              {activeComplaint.anonymous ? (
                <p className="text-xs text-stone-500 italic">ผู้ส่งเลือกส่งแบบ "ไม่ระบุตัวตน"</p>
              ) : privateContact ? (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm text-xs space-y-1">
                  <p><strong>ชื่อ-นามสกุล:</strong> {privateContact.name || '-'}</p>
                  <p><strong>ชั้น/ห้อง:</strong> {privateContact.gradeClass || '-'}</p>
                  <p><strong>ช่องทางติดต่อกลับ:</strong> {privateContact.contactMethod || '-'}</p>
                </div>
              ) : (
                <p className="text-xs text-stone-500">ไม่มีข้อมูลติดต่อส่วนตัว</p>
              )}
            </div>

            {/* Public Replies Section */}
            <div className="space-y-3 pt-2 border-t">
              <span className="text-xs font-semibold text-[#4B1F7A] block">
                ข้อความตอบกลับสาธารณะ (ผู้ส่งจะเห็นผ่านหน้ารหัสติดตาม):
              </span>

              {activeComplaint.publicReplies && activeComplaint.publicReplies.length > 0 ? (
                <div className="space-y-2">
                  {activeComplaint.publicReplies.map((r, i) => (
                    <div key={i} className="p-3 bg-[#FAF7F0] border border-[#B8923A]/30 rounded-sm text-xs">
                      <div className="flex justify-between text-[11px] text-[#9C7A2B]">
                        <span>{r.by || 'องค์การนักเรียน'}</span>
                        <span>{formatThaiDateTime(r.at)}</span>
                      </div>
                      <p className="mt-1 text-[#1B1226]">{r.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400">ยังไม่มีข้อความตอบกลับ</p>
              )}

              {/* Add New Public Reply */}
              <form onSubmit={handleAddPublicReply} className="space-y-2 pt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="พิมพ์ข้อความตอบกลับเพื่อแจ้งผลการพิจารณาหรือความคืบหน้าแก่นักเรียน..."
                  className="w-full text-xs input-underline bg-white p-2 border rounded-sm"
                  required
                />
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(activeComplaint)}
                    disabled={updating}
                    className="px-4 py-2 border border-red-200 text-[#9B1C31] hover:bg-red-50 text-xs font-medium rounded-sm transition-colors"
                  >
                    ลบเรื่องร้องเรียนนี้
                  </button>
                  <button
                    type="submit"
                    disabled={updating || !replyText.trim()}
                    className="px-5 py-2 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors"
                  >
                    + ส่งข้อความตอบกลับสาธารณะ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (avoids sandboxed iframe window.confirm blocking) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#B8923A]/50 rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-[#2A1245]">
              ยืนยันการลบเรื่องร้องเรียน
            </h3>
            <p className="text-xs text-[#1B1226]/80 leading-relaxed">
              คุณต้องการลบเรื่องร้องเรียนรหัส{' '}
              <span className="font-mono font-bold text-[#4B1F7A]">
                {deleteTarget.trackingCode || deleteTarget.id}
              </span>{' '}
              ({deleteTarget.title}) ถาวรหรือไม่? การลบไม่สามารถกู้คืนได้
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#4B1F7A]/15">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={updating}
                className="px-4 py-2 border border-stone-300 bg-white text-xs text-[#1B1226] rounded-sm hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteComplaint}
                disabled={updating}
                className="px-5 py-2 bg-[#9B1C31] text-white text-xs font-medium rounded-sm hover:bg-red-900 disabled:opacity-60"
              >
                {updating ? 'กำลังลบ...' : 'ยืนยันการลบถาวร'}
              </button>
            </div>
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
