/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Lenis from 'lenis';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { ScrollProgress } from '../common/ScrollProgress';
import { Preloader } from '../common/Preloader';
import { CookieConsent } from '../common/CookieConsent';
import { SeoHead } from '../common/SeoHead';
import { LanguageProvider } from '../../context/LanguageContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { prefetchNews } from '../../lib/publicDataService';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getLangFromPath } from '../../lib/i18nRouting';
import { pickArrayL10n } from '../../lib/l10n';

// ข้อความตั้งต้นแบบเก่าสำหรับตรวจสอบเพื่อให้หน้า EN แสดงชุดข้อความภาษาอังกฤษมาตรฐานเมื่อยังไม่มีการแปล
const LEGACY_TH_DEFAULT_TICKERS = new Set([
  'ยินดีต้อนรับสู่เว็บไซต์ทางการ องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา',
  'ร่วมส่งเสียงและข้อเสนอแนะเพื่อพัฒนาโรงเรียนของเราผ่านระบบรับเรื่องร้องเรียนออนไลน์',
  'ติดตามปฏิทินกิจกรรมและการดาวน์โหลดเอกสารระเบียบข้อบังคับได้ที่นี่',
]);

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { ticker, tickerEn } = useSiteSettings();
  const currentLang = getLangFromPath(location.pathname);

  const resolvedTicker = React.useMemo(() => {
    if (currentLang === 'en') {
      const cleanEn = tickerEn.map((s) => s.trim()).filter(Boolean);
      if (cleanEn.length > 0) return cleanEn;
      const hasOnlyLegacyDefaults =
        ticker.length > 0 && ticker.every((item) => LEGACY_TH_DEFAULT_TICKERS.has(item.trim()));
      if (hasOnlyLegacyDefaults) return [];
    }
    return pickArrayL10n(ticker, tickerEn, currentLang).items;
  }, [currentLang, ticker, tickerEn]);

  // Smooth scroll via Lenis only on desktop pointers; let iPhone/iPad use native hardware momentum scrolling
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReducedMotion || !isDesktopPointer) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    let animId = 0;
    function raf(time: number) {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    }

    animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, []);

  // Prefetch News & common public route chunks on idle so navigation on mobile/iPad feels instant
  useEffect(() => {
    const prefetchAll = () => {
      prefetchNews();
      void import('../../pages/News');
      void import('../../pages/NewsDetail');
      void import('../../pages/Calendar');
      void import('../../pages/Downloads');
      void import('../../pages/TrackComplaint');
      void import('../../pages/Complaint');
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(prefetchAll, { timeout: 1500 });
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timer = setTimeout(prefetchAll, 800);
    return () => clearTimeout(timer);
  }, []);

  // Increment total site visits once per session
  useEffect(() => {
    async function trackSessionVisit() {
      try {
        if (!sessionStorage.getItem('desup_visited')) {
          sessionStorage.setItem('desup_visited', 'true');
          await updateDoc(doc(db, 'settings', 'site'), {
            totalVisits: increment(1)
          });
        }
      } catch {
        // Ignore if settings doc doesn't exist yet
      }
    }

    trackSessionVisit();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <LanguageProvider>
      <SeoHead />
      <div className="min-h-screen flex flex-col bg-bg text-text relative selection:bg-brand-soft selection:text-heading">
        {/* แถบความคืบหน้าการเลื่อนหน้าจอ */}
        <ScrollProgress />

        {/* หน้าจอต้อนรับขณะเข้าชมครั้งแรก */}
        <Preloader />

        {/* แถบนำทางหลักและประกาศ */}
        <Navbar tickerItems={resolvedTicker} />

        {/* เนื้อหาหลักของแต่ละหน้า */}
        <main className="flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* ส่วนท้ายเว็บไซต์ */}
        <Footer />

        {/* แบนเนอร์ขอความยินยอมคุกกี้ */}
        <CookieConsent />
      </div>
    </LanguageProvider>
  );
};
