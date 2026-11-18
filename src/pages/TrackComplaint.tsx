/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ComplaintItem, ComplaintStatus } from '../types';
import { formatDateTime } from '../lib/format';
import { ComplaintStatusBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { SeoHead } from '../components/common/SeoHead';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../lib/i18nRouting';
import {
  getLocalComplaintHistory,
  removeComplaintFromLocalHistory,
  saveComplaintToLocalHistory,
} from '../lib/complaintTracking';

const STAGE_KEYS: ComplaintStatus[] = ['received', 'considering', 'in_progress', 'resolved'];

export const TrackComplaint: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { academicYearTH } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [myComplaints, setMyComplaints] = useState<ComplaintItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // โหลดรายการ Case ID ที่เคยส่งหรือเปิดดูจากอุปกรณ์นี้
  const loadLocalComplaints = useCallback(async () => {
    const localEntries = getLocalComplaintHistory();
    if (localEntries.length === 0) {
      setMyComplaints([]);
      return;
    }

    const items = await Promise.all(
      localEntries.slice(0, 15).map(async (entry) => {
        try {
          const snap = await getDoc(doc(db, 'complaints', entry.trackingCode));
          return snap.exists() ? ({ id: snap.id, ...snap.data() } as ComplaintItem) : null;
        } catch {
          return null;
        }
      })
    );

    const valid = items
      .filter((item): item is ComplaintItem => item !== null)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setMyComplaints(valid);
  }, []);

  useEffect(() => {
    void loadLocalComplaints();
  }, [loadLocalComplaints]);

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
        setNotFound(t('track.errors.notFound', { code: cleanCode }));
      }
    } catch (err) {
      console.warn("Error tracking complaint:", err);
      setNotFound(t('track.errors.notFound', { code: cleanCode }));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    const url = `${window.location.origin}${localizePath(`/track?code=${complaint.trackingCode}`, lang)}`;
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
      <SeoHead titleKey="seo.pages.track.title" descriptionKey="seo.pages.track.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText={t('track.eyebrowEn')} thText={t('track.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          {t('track.title')}
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          {t('track.subtitle')}
        </p>
      </div>

      {/* ช่องค้นหาด้วย Case ID */}
      <div className="bg-surface border border-gold-border/40 p-4 sm:p-6 rounded-sm shadow-editorial space-y-3">
        <label htmlFor="case-id-input" className="block font-serif text-sm font-semibold text-heading">
          {t('track.tabCode')}
        </label>
        <form onSubmit={handleSubmitCode} className="flex flex-col sm:flex-row gap-3">
          <input
            id="case-id-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('track.codePlaceholder', { year: academicYearTH })}
            className="flex-1 input-underline text-sm sm:text-base font-mono tracking-wider px-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors shadow-editorial whitespace-nowrap"
          >
            {loading ? t('track.searching') : t('track.checkStatusBtn')}
          </button>
        </form>
      </div>

      {/* ประวัติ Case ID ที่เคยส่งจากอุปกรณ์นี้ (แสดงเมื่อมีรายการ) */}
      {myComplaints.length > 0 && (
        <section className="bg-surface-elevated border border-gold-border/20 p-4 sm:p-6 rounded-sm shadow-editorial-sm space-y-3">
          <h2 className="font-serif text-base font-semibold text-heading border-b border-gold-border/15 pb-2">
            {t('track.myComplaintsTitle')}
          </h2>

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
                        title={t('track.removeFromDeviceTitle')}
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
                    <span>{formatDateTime(item.createdAt, lang)}</span>
                    <span className="text-accent font-medium">
                      {(item.publicReplies?.length || 0) > 0
                        ? t('track.repliedCount', { count: item.publicReplies?.length })
                        : t('track.viewDetails')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {notFound && (
        <div className="p-6 text-center border border-dashed border-error/40 rounded-sm bg-error-bg/60 space-y-2">
          <p className="font-serif text-base font-semibold text-error">
            {notFound}
          </p>
          <p className="text-xs text-text-muted">
            {t('track.notFoundHint')}
          </p>
        </div>
      )}

      {/* ผลลัพธ์สถานะและไทม์ไลน์การดำเนินงาน */}
      {complaint && (
        <div className="bg-surface border border-gold-border/25 p-5 sm:p-6 md:p-10 rounded-sm shadow-editorial space-y-6 sm:space-y-8 relative">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          {/* หัวข้อเรื่องและข้อมูลเบื้องต้น */}
          <div className="border-b border-gold-border/20 pb-5 sm:pb-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-gold-text tracking-wider">
                  {t('track.codePrefix', { code: complaint.trackingCode })}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="text-[11px] px-2 py-0.5 bg-surface-elevated border border-gold-border/40 rounded-sm text-accent hover:bg-brand-soft"
                >
                  {copiedLink ? t('track.copiedCaseLink') : t('track.copyCaseLink')}
                </button>
              </div>
              <ComplaintStatusBadge status={complaint.status} />
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-heading pt-1">
              {complaint.title}
            </h2>

            <div className="text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {complaint.location && complaint.location !== 'ไม่ระบุ' && (
                <>
                  <span>{t('track.locationMeta', { location: complaint.location })}</span>
                  <span>·</span>
                </>
              )}
              <span>{t('track.submittedAtMeta', { date: formatDateTime(complaint.createdAt, lang) })}</span>
              <span>·</span>
              <span>{complaint.anonymous ? t('track.senderAnon') : t('track.senderIdentified')}</span>
            </div>
          </div>

          {/* ไทม์ไลน์ 4 ขั้นตอนแนวตั้ง */}
          <div className="space-y-6 pt-2">
            <h3 className="font-serif text-lg font-semibold text-heading">
              {t('track.timelineHeading')}
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gold-border/25">
              {STAGE_KEYS.map((stageKey, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stageKey} className="relative">
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
                        {t(`track.stages.${stageKey}.label`)}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] text-gold-text font-sans font-normal uppercase tracking-wider bg-brand-soft px-2 py-0.5 rounded-sm">
                            {t('track.currentStageBadge')}
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ข้อความตอบกลับอย่างเป็นทางการ */}
          <div className="border-t border-gold-border/20 pt-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-heading">
              {t('track.repliesHeading')}
            </h3>

            {complaint.publicReplies && complaint.publicReplies.length > 0 ? (
              <div className="space-y-3">
                {complaint.publicReplies.map((reply, index) => (
                  <div key={index} className="p-4 bg-surface-elevated border border-gold-border/30 rounded-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gold-text">
                      <span className="font-medium font-serif">{reply.by || t('track.defaultReplyAuthor')}</span>
                      <span>{formatDateTime(reply.at, lang)}</span>
                    </div>
                    <p className="text-xs text-text leading-relaxed pt-1 font-sans">
                      {reply.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-surface-elevated/70 border border-gold-border/20 rounded-sm text-xs text-text-muted text-center">
                {t('track.noReplies')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
