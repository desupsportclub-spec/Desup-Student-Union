/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { ComplaintItem, ComplaintStatus } from '../types';
import { formatThaiDateTime } from '../lib/format';
import { ComplaintStatusBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { useSiteSettings } from '../context/SiteSettingsContext';
import {
  findComplaintsByRecoveryKey,
  getLocalComplaintHistory,
  removeComplaintFromLocalHistory,
  saveComplaintToLocalHistory,
} from '../lib/complaintTracking';

const STAGES: { key: ComplaintStatus; label: string; desc: string }[] = [
  { key: 'received', label: 'รับเรื่องแล้ว', desc: 'ระบบได้บันทึกเรื่องร้องเรียนเข้าสู่ฐานข้อมูลเรียบร้อยแล้ว' },
  { key: 'considering', label: 'กำลังพิจารณา', desc: 'คณะกรรมการและอาจารย์ที่ปรึกษากำลังตรวจสอบข้อเท็จจริง' },
  { key: 'in_progress', label: 'กำลังดำเนินการ', desc: 'อยู่ระหว่างการประสานงานกับฝ่ายที่เกี่ยวข้องเพื่อแก้ไขปัญหา' },
  { key: 'resolved', label: 'ดำเนินการเสร็จสิ้น', desc: 'การดำเนินการเสร็จสมบูรณ์หรือมีข้อสรุปที่ชัดเจน' },
];

export const TrackComplaint: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lookupMode, setLookupMode] = useState<'code' | 'recovery'>('code');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [recoveryKeyword, setRecoveryKeyword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [myComplaints, setMyComplaints] = useState<ComplaintItem[]>([]);
  const [myListLoading, setMyListLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Merge complaints from local device history + signed-in Google account
  const loadMyComplaints = useCallback(async (user: User | null) => {
    setMyListLoading(true);
    try {
      const localEntries = getLocalComplaintHistory();
      const map = new Map<string, ComplaintItem>();

      // 1. Fetch live status of local device history in parallel
      const localPromises = localEntries.slice(0, 15).map(async (entry) => {
        try {
          const snap = await getDoc(doc(db, 'complaints', entry.trackingCode));
          if (snap.exists()) {
            const item = { id: snap.id, ...snap.data() } as ComplaintItem;
            map.set(item.trackingCode, item);
          }
        } catch {
          // Ignore deleted or unreadable item
        }
      });

      // 2. Fetch cross-device complaints linked to signed-in Google account
      const accountPromise = user
        ? getDocs(query(collection(db, 'complaints'), where('reporterUid', '==', user.uid)))
            .then((snap) => {
              snap.forEach((d) => {
                const item = { id: d.id, ...d.data() } as ComplaintItem;
                map.set(item.trackingCode, item);
              });
            })
            .catch(() => {})
        : Promise.resolve();

      await Promise.all([...localPromises, accountPromise]);

      const merged = Array.from(map.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      setMyComplaints(merged);
    } finally {
      setMyListLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      void loadMyComplaints(u);
    });
    return () => unsub();
  }, [loadMyComplaints]);

  const fetchComplaint = useCallback(async (trackingCodeToFetch: string) => {
    const cleanCode = trackingCodeToFetch.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setNotFound(null);
    setComplaint(null);

    try {
      const docRef = doc(db, 'complaints', cleanCode);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() } as ComplaintItem;
        setComplaint(item);
        setCode(item.trackingCode);

        // Save to local device history for quick one-tap access next time
        saveComplaintToLocalHistory({
          trackingCode: item.trackingCode,
          title: item.title,
          type: item.type,
          createdAt: item.createdAt,
        });
        setMyComplaints((prev) => {
          const filtered = prev.filter((p) => p.trackingCode !== item.trackingCode);
          return [item, ...filtered].sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || '')
          );
        });
      } else {
        setNotFound(`ไม่พบข้อมูลเรื่องร้องเรียนรหัส "${cleanCode}"`);
      }
    } catch (err) {
      console.warn("Error tracking complaint:", err);
      setNotFound(`ไม่พบข้อมูลเรื่องร้องเรียนรหัส "${cleanCode}"`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      setCode(initialCode.toUpperCase());
      void fetchComplaint(initialCode);
    }
  }, [searchParams, fetchComplaint]);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setSearchParams({ code: clean });
    void fetchComplaint(clean);
  };

  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryKeyword.trim().length < 2 || recoveryPin.trim().length < 4) {
      setNotFound("กรุณากรอกคำจำส่วนตัว (อย่างน้อย 2 ตัวอักษร) และรหัส PIN (อย่างน้อย 4 หลัก)");
      return;
    }

    setLoading(true);
    setNotFound(null);
    setComplaint(null);

    try {
      const foundList = await findComplaintsByRecoveryKey(recoveryKeyword, recoveryPin);
      if (foundList.length === 0) {
        setNotFound("ไม่พบเรื่องร้องเรียนที่ตรงกับคำจำส่วนตัวและรหัส PIN นี้");
        return;
      }

      // Save all recovered items to device history and open the newest one
      foundList.forEach((item) => {
        saveComplaintToLocalHistory({
          trackingCode: item.trackingCode,
          title: item.title,
          type: item.type,
          createdAt: item.createdAt,
        });
      });

      setMyComplaints((prev) => {
        const map = new Map<string, ComplaintItem>();
        prev.forEach((p) => map.set(p.trackingCode, p));
        foundList.forEach((f) => map.set(f.trackingCode, f));
        return Array.from(map.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
      });

      setComplaint(foundList[0]);
      setCode(foundList[0].trackingCode);
      setSearchParams({ code: foundList[0].trackingCode });
    } catch (err) {
      console.warn("Recovery lookup error:", err);
      setNotFound("ไม่สามารถค้นหาข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setCurrentUser(res.user);
      await loadMyComplaints(res.user);
    } catch {
      // Ignore user cancel
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSelectMyComplaint = (item: ComplaintItem) => {
    setNotFound(null);
    setComplaint(item);
    setCode(item.trackingCode);
    setSearchParams({ code: item.trackingCode });
  };

  const handleRemoveFromDevice = (e: React.MouseEvent, trackingCode: string) => {
    e.stopPropagation();
    removeComplaintFromLocalHistory(trackingCode);
    setMyComplaints((prev) => prev.filter((item) => item.trackingCode !== trackingCode));
    if (complaint?.trackingCode === trackingCode) {
      setComplaint(null);
    }
  };

  const handleCopyDirectLink = () => {
    if (!complaint) return;
    const url = `${window.location.origin}/track?code=${complaint.trackingCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="STATUS TRACKING" thText="ติดตามสถานะเรื่องร้องเรียน" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          ตรวจสอบความคืบหน้า
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          ดูรายการเรื่องที่เคยส่งจากอุปกรณ์นี้ได้ทันที หรือค้นหาด้วยรหัสติดตาม / คำจำส่วนตัว / บัญชี Google
        </p>
      </div>

      {/* Section 1: My Saved Complaints (Automatic Local History + Google Sync) */}
      <section className="bg-surface-elevated border border-gold-border/20 p-4 sm:p-6 rounded-sm shadow-editorial-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-border/15 pb-3">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-semibold text-heading">
              เรื่องร้องเรียนของคุณ (บันทึกอัตโนมัติ)
            </h2>
            <p className="text-[11px] text-text-muted">
              {currentUser
                ? `ซิงค์ข้อมูลจากอุปกรณ์นี้และบัญชี ${currentUser.email}`
                : 'แสดงเรื่องที่เคยส่งหรือเปิดดูจากอุปกรณ์นี้โดยไม่ต้องกรอกรหัสซ้ำ'}
            </p>
          </div>

          {!currentUser && (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={authLoading}
              className="px-3.5 py-1.5 bg-surface border border-gold/50 hover:border-accent text-xs font-medium text-heading rounded-sm transition-colors self-start sm:self-auto shrink-0"
            >
              {authLoading ? 'กำลังเชื่อมต่อ...' : 'ดึงประวัติข้ามเครื่องด้วย Google'}
            </button>
          )}
        </div>

        {myListLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-14 bg-bg-alt rounded-sm" />
            <div className="h-14 bg-bg-alt rounded-sm" />
          </div>
        ) : myComplaints.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myComplaints.map((item) => {
              const isSelected = complaint?.trackingCode === item.trackingCode;
              return (
                <div
                  key={item.trackingCode}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectMyComplaint(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectMyComplaint(item);
                    }
                  }}
                  className={`p-3.5 rounded-sm border text-left cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-accent bg-brand-soft/50 ring-1 ring-accent'
                      : 'border-gold-border/20 bg-surface/70 hover:border-gold'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-gold-text">
                      {item.trackingCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ComplaintStatusBadge status={item.status} />
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFromDevice(e, item.trackingCode)}
                        title="นำออกจากประวัติในเครื่องนี้"
                        className="text-text-muted hover:text-error text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="font-serif text-sm font-semibold text-heading line-clamp-1">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{formatThaiDateTime(item.createdAt)}</span>
                    <span className="text-accent font-medium">
                      {(item.publicReplies?.length || 0) > 0
                        ? `ตอบกลับแล้ว (${item.publicReplies?.length})`
                        : 'ดูรายละเอียด →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-5 px-4 text-center bg-surface/60 border border-dashed border-gold-border/25 rounded-sm space-y-2">
            <p className="text-xs text-text-muted">
              ยังไม่มีประวัติการส่งเรื่องร้องเรียนบนอุปกรณ์นี้
            </p>
            <Link
              to="/complaint"
              className="inline-block text-xs font-medium text-accent hover:underline"
            >
              ส่งเรื่องร้องเรียน / ข้อเสนอแนะใหม่ →
            </Link>
          </div>
        )}
      </section>

      {/* Section 2: Search Tabs (By Tracking Code OR By Recovery Keyword + PIN) */}
      <div className="bg-surface border border-gold-border/40 p-4 sm:p-6 rounded-sm shadow-editorial space-y-4">
        <div className="flex items-center gap-4 border-b border-gold-border/15 pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setLookupMode('code');
              setNotFound(null);
            }}
            className={`pb-2 transition-colors relative ${
              lookupMode === 'code'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-heading'
            }`}
          >
            ค้นหาด้วยรหัสติดตาม
            {lookupMode === 'code' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setLookupMode('recovery');
              setNotFound(null);
            }}
            className={`pb-2 transition-colors relative ${
              lookupMode === 'recovery'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-heading'
            }`}
          >
            ลืมรหัส? ค้นหาด้วยคำจำส่วนตัว + PIN
            {lookupMode === 'recovery' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
            )}
          </button>
        </div>

        {lookupMode === 'code' ? (
          <form onSubmit={handleSubmitCode} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={`กรอกรหัสติดตาม เช่น SC-${academicYearTH}-ABCDEF`}
              className="flex-1 input-underline text-sm sm:text-base font-mono tracking-wider px-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors shadow-editorial whitespace-nowrap"
            >
              {loading ? 'กำลังค้นหา...' : 'ตรวจสอบสถานะ →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitRecovery} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                value={recoveryKeyword}
                onChange={(e) => setRecoveryKeyword(e.target.value)}
                placeholder="คำจำส่วนตัวที่ตั้งไว้ (เช่น รหัสนักเรียน / ชื่อเล่น)"
                className="sm:col-span-5 input-underline text-xs px-2"
                required
              />
              <input
                type="password"
                inputMode="numeric"
                value={recoveryPin}
                onChange={(e) => setRecoveryPin(e.target.value)}
                placeholder="รหัส PIN 4-6 หลัก"
                className="sm:col-span-4 input-underline text-xs px-2"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-3 px-6 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors whitespace-nowrap"
              >
                {loading ? 'กำลังกู้คืน...' : 'ค้นหาเรื่องเดิม →'}
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              ใช้คำจำส่วนตัวและรหัส PIN ที่ตั้งไว้ตอนส่งเรื่อง ระบบจะดึงรายการเรื่องทั้งหมดของคุณกลับมาให้อัตโนมัติ
            </p>
          </form>
        )}
      </div>

      {notFound && (
        <div className="p-6 text-center border border-dashed border-error/40 rounded-sm bg-error-bg/60 space-y-2">
          <p className="font-serif text-base font-semibold text-error">
            {notFound}
          </p>
          <p className="text-xs text-text-muted">
            โปรดตรวจสอบความถูกต้องของรหัสติดตาม หรือลองกู้คืนด้วยคำจำส่วนตัว + PIN / บัญชี Google
          </p>
        </div>
      )}

      {/* Complaint Status & Timeline Result */}
      {complaint && (
        <div className="bg-surface border border-gold-border/25 p-5 sm:p-6 md:p-10 rounded-sm shadow-editorial space-y-6 sm:space-y-8 relative">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          {/* Title & Metadata */}
          <div className="border-b border-gold-border/20 pb-5 sm:pb-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-gold-text tracking-wider">
                  รหัส: {complaint.trackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="text-[11px] px-2 py-0.5 bg-surface-elevated border border-gold-border/40 rounded-sm text-accent hover:bg-brand-soft"
                >
                  {copiedLink ? 'คัดลอกลิงก์แล้ว ✓' : '🔗 คัดลอกลิงก์เรื่องนี้'}
                </button>
              </div>
              <ComplaintStatusBadge status={complaint.status} />
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-heading pt-1">
              {complaint.title}
            </h2>

            <div className="text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-1 pt-1">
              <span>สถานที่: {complaint.location || 'ไม่ระบุ'}</span>
              <span>·</span>
              <span>ส่งเมื่อ: {formatThaiDateTime(complaint.createdAt)}</span>
              <span>·</span>
              <span>{complaint.anonymous ? 'ผู้ส่ง: ไม่ระบุตัวตน' : 'ผู้ส่ง: ระบุตัวตน'}</span>
            </div>
          </div>

          {/* 4-Step Vertical Timeline */}
          <div className="space-y-6 pt-2">
            <h3 className="font-serif text-lg font-semibold text-heading">
              ขั้นตอนการดำเนินงาน
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gold-border/25">
              {STAGES.map((st, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={st.key} className="relative">
                    {/* Node */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-colors ${
                        isPassed
                          ? 'bg-gold border-accent'
                          : 'bg-surface-elevated border-gold-border/30'
                      }`}
                    />

                    <div>
                      <h4
                        className={`font-serif text-base font-semibold ${
                          isCurrent
                            ? 'text-accent'
                            : isPassed
                            ? 'text-heading'
                            : 'text-text-muted/60'
                        }`}
                      >
                        {st.label}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] text-gold-text font-sans font-normal uppercase tracking-wider bg-brand-soft px-2 py-0.5 rounded-sm">
                            ขั้นตอนปัจจุบัน
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Public Official Replies */}
          <div className="border-t border-gold-border/20 pt-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-heading">
              ข้อความตอบกลับจากองค์การนักเรียน
            </h3>

            {complaint.publicReplies && complaint.publicReplies.length > 0 ? (
              <div className="space-y-3">
                {complaint.publicReplies.map((reply, index) => (
                  <div key={index} className="p-4 bg-surface-elevated border border-gold-border/30 rounded-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gold-text">
                      <span className="font-medium font-serif">{reply.by || 'องค์การนักเรียน'}</span>
                      <span>{formatThaiDateTime(reply.at)}</span>
                    </div>
                    <p className="text-xs text-text leading-relaxed pt-1 font-sans">
                      {reply.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-surface-elevated/70 border border-gold-border/20 rounded-sm text-xs text-text-muted text-center">
                อยู่ระหว่างการพิจารณา เมื่อมีความคืบหน้าคณะทำงานจะแจ้งผลการตอบกลับ ณ จุดนี้
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
