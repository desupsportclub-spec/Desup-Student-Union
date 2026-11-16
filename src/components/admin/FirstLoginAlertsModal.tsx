/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from '@phosphor-icons/react';
import {
  getComplaintTypeLabel,
  usePendingComplaints,
} from '../../admin/ComplaintAlertsContext';

function formatRelativeTimeTH(isoDate?: string): string {
  if (!isoDate) return 'เมื่อสักครู่';
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 'เมื่อสักครู่';

  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} เดือนที่แล้ว`;
}

export const FirstLoginAlertsModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    firstLoginModalOpen,
    dismissFirstLoginModal,
    pendingCount,
    countsByStatus,
    pendingComplaints,
  } = usePendingComplaints();

  const [displayCount, setDisplayCount] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Count-up animation for total pending count
  useEffect(() => {
    if (!firstLoginModalOpen) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || pendingCount <= 1) {
      setDisplayCount(pendingCount);
      return;
    }

    let rafId = 0;
    const duration = 550;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * pendingCount));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayCount(pendingCount);
      }
    };

    setDisplayCount(0);
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [firstLoginModalOpen, pendingCount]);

  // Focus management, focus trap, Escape key & restore focus on close
  useEffect(() => {
    if (!firstLoginModalOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Move focus into dialog on open
    const focusTimer = window.setTimeout(() => {
      primaryBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissFirstLoginModal();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [firstLoginModalOpen, dismissFirstLoginModal]);

  if (!firstLoginModalOpen || pendingCount === 0) {
    return null;
  }

  const latestThree = pendingComplaints.slice(0, 3);
  const statusChips = [
    { key: 'received', label: 'รับเรื่อง', count: countsByStatus.received },
    { key: 'considering', label: 'กำลังพิจารณา', count: countsByStatus.considering },
    { key: 'in_progress', label: 'กำลังดำเนินการ', count: countsByStatus.in_progress },
  ].filter((c) => c.count > 0);

  const handleGoToComplaints = () => {
    dismissFirstLoginModal();
    navigate('/admin/complaints');
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-anchor-bg-deep/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissFirstLoginModal();
      }}
    >
      {/* Outer chamfered gold frame */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="มีเรื่องร้องเรียนรอดำเนินการ"
        className="w-full max-w-lg my-auto bg-gold p-[1.5px] shadow-2xl chamfered-frame-outer"
      >
        <div className="bg-surface p-[3px] chamfered-frame-mid">
          {/* Inner chamfered gold frame */}
          <div className="bg-gold-light p-[1px] chamfered-frame-inner">
            <div className="bg-surface px-4 py-5 sm:px-7 sm:py-6 chamfered-frame-body space-y-5">
              {/* Top Icon + Heading */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-brand-soft border border-gold-border/45 flex items-center justify-center text-accent">
                  <Bell size={26} weight="light" className="animate-bell-swing origin-top" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-gold-text font-semibold block">
                    แจ้งเตือนผู้ดูแลระบบ
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-heading">
                    มีเรื่องร้องเรียนรอดำเนินการ
                  </h2>
                </div>

                {/* Count-up total */}
                <div className="pt-1 flex items-baseline justify-center gap-2">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-accent tabular-numbers leading-none">
                    {displayCount}
                  </span>
                  <span className="text-xs sm:text-sm text-text-muted font-medium">
                    เรื่องค้างทั้งหมด
                  </span>
                </div>

                {/* Status summary chips */}
                {statusChips.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-heading">
                    <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-1 bg-brand-soft/75 border border-gold-border/35 rounded-sm font-medium">
                      {statusChips.map((chip, idx) => (
                        <React.Fragment key={chip.key}>
                          {idx > 0 && <span className="text-gold-text" aria-hidden="true">·</span>}
                          <span>
                            {chip.label} <strong className="text-accent tabular-numbers">{chip.count}</strong>
                          </span>
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {/* Latest 3 pending items */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gold-text uppercase tracking-wider">
                  รายการล่าสุดที่รอดำเนินการ ({latestThree.length} จาก {pendingCount} เรื่อง)
                </p>
                <div className="divide-y divide-gold-border/15 border border-gold-border/30 bg-surface-elevated/85 rounded-sm">
                  {latestThree.map((item) => (
                    <div
                      key={item.id || item.trackingCode}
                      className="p-3 space-y-1 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className="font-mono font-bold text-accent text-[11px]">
                            {item.trackingCode || item.id}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${
                              item.type === 'corruption'
                                ? 'bg-error-bg text-error border border-error/25'
                                : 'bg-brand-soft text-accent'
                            }`}
                          >
                            {getComplaintTypeLabel(item.type)}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted shrink-0">
                          {formatRelativeTimeTH(item.createdAt)}
                        </span>
                      </div>
                      <p className="font-medium text-text line-clamp-1">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-gold-border/25">
                <button
                  type="button"
                  onClick={dismissFirstLoginModal}
                  className="px-4 py-2.5 border border-gold-border/25 bg-surface-elevated text-text hover:bg-bg-alt text-xs font-medium rounded-sm transition-colors"
                >
                  ไว้ทีหลัง
                </button>
                <button
                  ref={primaryBtnRef}
                  type="button"
                  onClick={handleGoToComplaints}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-brand-contrast text-xs font-medium rounded-sm transition-colors shadow-sm"
                >
                  <span>ดูเรื่องร้องเรียน</span>
                  <ArrowRight size={14} weight="bold" className="text-gold-light" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
