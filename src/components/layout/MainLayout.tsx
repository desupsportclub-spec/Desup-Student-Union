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
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { prefetchNews } from '../../lib/publicDataService';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { ticker: tickerItems } = useSiteSettings();

  // Smooth scroll via Lenis, respecting reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, []);

  // Prefetch News routes & warm news cache on idle so navigating to /news or articles is instant
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchNews();
      void import('../../pages/News');
      void import('../../pages/NewsDetail');
    }, 600);
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
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#1B1226] relative selection:bg-[#EDE6F5] selection:text-[#2A1245]">
      {/* Paper grain subtle noise texture */}
      <div className="paper-grain" aria-hidden="true" />

      {/* Top scroll progress */}
      <ScrollProgress />

      {/* Session-based initial preloader */}
      <Preloader />

      {/* Main sticky navigation */}
      <Navbar tickerItems={tickerItems} />

      {/* Crisp route view without blocking exit delay */}
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

      {/* Main Footer */}
      <Footer />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};
