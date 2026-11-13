/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ComplaintItem, ComplaintStatus } from '../types';
import { formatThaiDateTime } from '../lib/format';
import { ComplaintStatusBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { useSiteSettings } from '../context/SiteSettingsContext';

const STAGES: { key: ComplaintStatus; label: string; desc: string }[] = [
  { key: 'received', label: 'รับเรื่องแล้ว', desc: 'ระบบได้บันทึกเรื่องร้องเรียนเข้าสู่ฐานข้อมูลเรียบร้อยแล้ว' },
  { key: 'considering', label: 'กำลังพิจารณา', desc: 'คณะกรรมการและอาจารย์ที่ปรึกษากำลังตรวจสอบข้อเท็จจริง' },
  { key: 'in_progress', label: 'กำลังดำเนินการ', desc: 'อยู่ระหว่างการประสานงานกับฝ่ายที่เกี่ยวข้องเพื่อแก้ไขปัญหา' },
  { key: 'resolved', label: 'ดำเนินการเสร็จสิ้น', desc: 'การดำเนินการเสร็จสมบูรณ์หรือมีข้อสรุปที่ชัดเจน' },
];

export const TrackComplaint: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchComplaint = async (trackingCodeToFetch: string) => {
    const cleanCode = trackingCodeToFetch.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setNotFound(false);
    setComplaint(null);

    try {
      const docRef = doc(db, 'complaints', cleanCode);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setComplaint({ id: snap.id, ...snap.data() } as ComplaintItem);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.warn("Error tracking complaint:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      fetchComplaint(initialCode);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(code);
  };

  // Determine stage progress
  const getStageIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'received': return 0;
      case 'considering': return 1;
      case 'in_progress': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  const currentStageIndex = complaint ? getStageIndex(complaint.status) : 0;

  return (
    <div className="max-w-[840px] mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="STATUS TRACKING" thText="ติดตามสถานะเรื่องร้องเรียน" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          ตรวจสอบความคืบหน้า
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          กรอกรหัสติดตาม (รูปแบบ SC-{academicYearTH}-XXXXXX) ที่ได้รับเมื่อส่งเรื่อง
        </p>
      </div>

      {/* Code Input Box */}
      <div className="bg-[#FAF7F0] border border-[#B8923A]/40 p-6 md:p-8 rounded-sm shadow-editorial">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={`ตัวอย่าง: SC-${academicYearTH}-ABCDEF`}
            className="flex-1 input-underline text-base font-mono tracking-wider px-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors shadow-editorial whitespace-nowrap"
          >
            {loading ? 'กำลังค้นหา...' : 'ตรวจสอบสถานะ →'}
          </button>
        </form>
      </div>

      {notFound && (
        <div className="p-8 text-center border border-dashed border-[#9B1C31]/40 rounded-sm bg-red-50/40 space-y-2">
          <p className="font-serif text-base font-semibold text-[#9B1C31]">
            ไม่พบข้อมูลเรื่องร้องเรียนรหัส "{code}"
          </p>
          <p className="text-xs text-[#1B1226]/60">
            โปรดตรวจสอบความถูกต้องของรหัสติดตาม (ตัวพิมพ์ใหญ่และตัวเลข) หรือติดต่อองค์การนักเรียนโดยตรง
          </p>
        </div>
      )}

      {/* Complaint Status & Timeline Result */}
      {complaint && (
        <div className="bg-[#FAF7F0] border border-[#4B1F7A]/20 p-6 md:p-10 rounded-sm shadow-editorial space-y-8 relative">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          {/* Title & Metadata */}
          <div className="border-b border-[#4B1F7A]/15 pb-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#9C7A2B] tracking-wider">
                รหัส: {complaint.trackingCode}
              </span>
              <ComplaintStatusBadge status={complaint.status} />
            </div>

            <h2 className="font-serif text-2xl font-semibold text-[#1B1226] pt-1">
              {complaint.title}
            </h2>

            <div className="text-xs text-[#1B1226]/60 flex flex-wrap gap-4 pt-1">
              <span>สถานที่: {complaint.location || 'ไม่ระบุ'}</span>
              <span>·</span>
              <span>ส่งเมื่อ: {formatThaiDateTime(complaint.createdAt)}</span>
              <span>·</span>
              <span>{complaint.anonymous ? 'ผู้ส่ง: ไม่ระบุตัวตน' : 'ผู้ส่ง: ระบุตัวตน'}</span>
            </div>
          </div>

          {/* 4-Step Vertical Timeline */}
          <div className="space-y-6 pt-2">
            <h3 className="font-serif text-lg font-semibold text-[#2A1245]">
              ขั้นตอนการดำเนินงาน
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-200">
              {STAGES.map((st, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={st.key} className="relative">
                    {/* Node */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-colors ${
                        isPassed
                          ? 'bg-[#B8923A] border-[#4B1F7A]'
                          : 'bg-white border-stone-300'
                      }`}
                    />

                    <div>
                      <h4
                        className={`font-serif text-base font-semibold ${
                          isCurrent
                            ? 'text-[#4B1F7A]'
                            : isPassed
                            ? 'text-[#1B1226]'
                            : 'text-stone-400'
                        }`}
                      >
                        {st.label}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] text-[#9C7A2B] font-sans font-normal uppercase tracking-wider bg-[#EDE6F5] px-2 py-0.5 rounded-sm">
                            ขั้นตอนปัจจุบัน
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[#1B1226]/65 mt-0.5">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Public Official Replies */}
          <div className="border-t border-[#4B1F7A]/15 pt-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2A1245]">
              ข้อความตอบกลับจากองค์การนักเรียน
            </h3>

            {complaint.publicReplies && complaint.publicReplies.length > 0 ? (
              <div className="space-y-3">
                {complaint.publicReplies.map((reply, index) => (
                  <div key={index} className="p-4 bg-white border border-[#B8923A]/30 rounded-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#9C7A2B]">
                      <span className="font-medium font-serif">{reply.by || 'องค์การนักเรียน'}</span>
                      <span>{formatThaiDateTime(reply.at)}</span>
                    </div>
                    <p className="text-xs text-[#1B1226] leading-relaxed pt-1 font-sans">
                      {reply.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/60 border border-stone-200 rounded-sm text-xs text-[#1B1226]/60 text-center">
                อยู่ระหว่างการพิจารณา เมื่อมีความคืบหน้าคณะทำงานจะแจ้งผลการตอบกลับ ณ จุดนี้
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
