/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CornerBracket } from './Ornament';

const COOKIE_NAME = 'desup_cookie_consent';
const COOKIE_PREFS_NAME = 'desup_cookie_prefs';
const ONE_YEAR_SECONDS = 31536000;

function setBrowserCookie(name: string, value: string, maxAgeSeconds = ONE_YEAR_SECONDS) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function getBrowserCookie(name: string): string | null {
  const target = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    const existingCookie = getBrowserCookie(COOKIE_NAME);
    const existingStorage = localStorage.getItem(COOKIE_NAME);
    const consent = existingCookie || existingStorage;

    if (consent) {
      // Ensure browser cookie and localStorage stay synchronized
      setBrowserCookie(COOKIE_NAME, consent);
      setAnalyticsEnabled(consent === 'accepted_all');
      if (consent === 'accepted_all') {
        setBrowserCookie('desup_analytics_active', '1');
      }
    } else {
      // Always set strictly-necessary session marker cookie
      setBrowserCookie('desup_necessary_session', 'active', 86400);
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Allow reopening cookie settings from Footer
  useEffect(() => {
    const handleReopen = () => {
      const consent = getBrowserCookie(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME);
      setAnalyticsEnabled(consent !== 'accepted_necessary');
      setShowDetails(true);
      setVisible(true);
    };

    window.addEventListener('desup:open-cookie-settings', handleReopen);
    return () => window.removeEventListener('desup:open-cookie-settings', handleReopen);
  }, []);

  const persistConsent = (status: 'accepted_all' | 'accepted_necessary') => {
    const now = new Date().toISOString();
    localStorage.setItem(COOKIE_NAME, status);
    localStorage.setItem(COOKIE_PREFS_NAME, JSON.stringify({ necessary: true, analytics: status === 'accepted_all', updatedAt: now }));

    setBrowserCookie(COOKIE_NAME, status);
    setBrowserCookie('desup_necessary_session', 'active');
    setBrowserCookie(COOKIE_PREFS_NAME, JSON.stringify({ necessary: true, analytics: status === 'accepted_all', at: now }));

    if (status === 'accepted_all') {
      setBrowserCookie('desup_analytics_active', '1');
    } else {
      setBrowserCookie('desup_analytics_active', '0', 0);
    }
    setVisible(false);
  };

  const handleAcceptAll = () => persistConsent('accepted_all');
  const handleAcceptNecessary = () => persistConsent('accepted_necessary');
  const handleSaveCustom = () => persistConsent(analyticsEnabled ? 'accepted_all' : 'accepted_necessary');

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-label="การตั้งค่าคุกกี้และความเป็นส่วนตัว"
          className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-8 md:max-w-lg z-50 bg-[#2A1245] text-[#FAF7F0] border-2 border-[#B8923A] p-4 sm:p-6 rounded-sm shadow-2xl"
        >
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D9B867] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                  <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
                  <circle cx="11.5" cy="14.5" r="1" fill="currentColor" />
                  <circle cx="15.5" cy="12.5" r="1" fill="currentColor" />
                </svg>
                <h3 className="font-serif text-base font-bold text-[#D9B867]">
                  การใช้คุกกี้และความเป็นส่วนตัว (PDPA)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="ปิดหน้าต่างคุกกี้"
                className="text-xs text-[#FAF7F0]/60 hover:text-[#FAF7F0]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#FAF7F0]/85 leading-relaxed font-sans">
              เว็บไซต์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา ใช้คุกกี้จริงในการจดจำการตั้งค่า การทำงานที่จำเป็นของระบบ ความปลอดภัย และสถิติการเข้าชม โดยเป็นไปตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒
            </p>

            {showDetails && (
              <div className="p-3 bg-white/5 border border-white/10 rounded text-[11px] space-y-2.5 text-[#FAF7F0]/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#FAF7F0]">คุกกี้ที่จำเป็น (Strictly Necessary)</p>
                    <p className="text-[#FAF7F0]/65">จดจำการตั้งค่าความเป็นส่วนตัว สถานะเซสชัน และความปลอดภัย</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">เปิดใช้งานเสมอ</span>
                </div>
                <label className="flex items-start justify-between gap-3 pt-2 border-t border-white/10 cursor-pointer">
                  <div>
                    <p className="font-semibold text-[#FAF7F0]">คุกกี้เพื่อการวิเคราะห์และสถิติ (Analytics)</p>
                    <p className="text-[#FAF7F0]/65">นับจำนวนการเปิดอ่านข่าวและสถิติการใช้งานโดยไม่ระบุตัวตน</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="mt-1 accent-[#D9B867]"
                  />
                </label>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] text-[#D9B867] hover:underline text-left"
              >
                {showDetails ? 'ซ่อนรายละเอียด' : 'ตั้งค่า / ดูรายละเอียดคุกกี้'}
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {showDetails ? (
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="px-4 py-1.5 border border-[#D9B867] text-xs font-medium text-[#D9B867] hover:bg-white/10 rounded-sm transition-colors"
                  >
                    บันทึกการตั้งค่า
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAcceptNecessary}
                    className="px-3.5 py-1.5 border border-[#B8923A]/50 text-xs text-[#FAF7F0] hover:bg-white/10 rounded-sm transition-colors"
                  >
                    จำเป็นเท่านั้น
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-1.5 bg-[#B8923A] text-[#1B1226] text-xs font-semibold hover:bg-[#D9B867] rounded-sm shadow-md transition-colors"
                >
                  ยอมรับทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
