/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_CONFIG } from '../../config/site';
import { ThemeSwitcher } from './ThemeSwitcher';

interface NavbarProps {
  tickerItems?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ tickerItems = [] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'news' | 'about' | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<'news' | 'about' | null>(null);

  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setMobileSubmenu(null);
  }, [location.pathname]);

  // Lock background scroll & support Escape key when mobile drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Handle scroll behavior (hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setIsVisible(false); // scrolling down
        setActiveDropdown(null);
      } else {
        setIsVisible(true); // scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Default ticker announcements if none stored yet
  const displayTicker = tickerItems.length > 0 ? tickerItems : [
    "ยินดีต้อนรับสู่เว็บไซต์ทางการ องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
    "ร่วมส่งเสียงและข้อเสนอแนะเพื่อพัฒนาโรงเรียนของเราผ่านระบบรับเรื่องร้องเรียนออนไลน์",
    "ติดตามปฏิทินกิจกรรมและการดาวน์โหลดเอกสารระเบียบข้อบังคับได้ที่นี่"
  ];

  const isActivePath = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-header-bg/95 md:backdrop-blur-md border-b border-gold-border/30 shadow-editorial-sm'
            : 'bg-header-bg border-b border-gold-border/15'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-8 relative z-30">
          {/* Zone 1: Emblem Brand Mark directly */}
          <Link
            to="/"
            className="flex items-center group shrink-0 py-1"
            aria-label="หน้าหลัก องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
          >
            <img
              src="/emblem.png"
              alt="ตราองค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
              data-emblem="true"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            />
          </Link>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-text">
            <Link
              to="/"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/' ? 'text-accent font-semibold' : ''
              }`}
            >
              หน้าหลัก
            </Link>

            {/* Dropdown: เกี่ยวกับเรา */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/about/emblem"
                className={`flex items-center gap-1 hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2 ${
                  location.pathname.startsWith('/about') ? 'text-accent font-semibold' : ''
                }`}
              >
                <span>เกี่ยวกับเรา</span>
                <span className="text-[10px] text-gold-text">▾</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'about' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-64 bg-surface border-2 border-gold p-3 shadow-2xl rounded-sm z-50"
                  >
                    <Link to="/about/emblem" className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading">
                      ตราสัญลักษณ์
                    </Link>
                    <Link to="/about/authority" className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading">
                      อำนาจหน้าที่
                    </Link>
                    <Link to="/about/board" className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading">
                      คณะกรรมการองค์การนักเรียน
                    </Link>
                    <Link to="/about/advisors" className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading">
                      คณะกรรมการที่ปรึกษา
                    </Link>
                    <Link to="/about/hall" className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading">
                      ทำเนียบนายกองค์การนักเรียน
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dropdown: ข่าวสาร */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('news')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/news"
                className={`flex items-center gap-1 hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2 ${
                  location.pathname.startsWith('/news') ? 'text-accent font-semibold' : ''
                }`}
              >
                <span>ข่าวสาร</span>
                <span className="text-[10px] text-gold-text">▾</span>
              </Link>

              {/* Mega panel dropdown floating cleanly above ticker with z-50 */}
              <AnimatePresence>
                {activeDropdown === 'news' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-72 bg-surface border-2 border-gold p-3 shadow-2xl rounded-sm z-50"
                  >
                    <Link to="/news/pr" className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors">
                      <div className="font-medium text-heading">ข่าวประชาสัมพันธ์</div>
                    </Link>
                    <Link to="/news/activity" className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors">
                      <div className="font-medium text-heading">ภาพข่าวกิจกรรม</div>
                    </Link>
                    <Link to="/news/regulation" className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors">
                      <div className="font-medium text-heading">ข้อบังคับ ระเบียบ คำสั่งและประกาศ</div>
                    </Link>
                    <Link to="/news/knowledge" className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors">
                      <div className="font-medium text-heading">สาระน่ารู้</div>
                    </Link>
                    <Link to="/news/video" className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors">
                      <div className="font-medium text-heading">คลิปวิดีโอ</div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/calendar"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/calendar' ? 'text-accent font-semibold' : ''
              }`}
            >
              ปฏิทินกิจกรรม
            </Link>

            <Link
              to="/downloads"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/downloads' ? 'text-accent font-semibold' : ''
              }`}
            >
              ดาวน์โหลด
            </Link>

            <Link
              to="/contact"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/contact' ? 'text-accent font-semibold' : ''
              }`}
            >
              ติดต่อ
            </Link>
          </nav>

          {/* Zone 3: Theme Switcher + Primary CTA button + Mobile trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeSwitcher variant="dropdown" />

            <Link
              to="/complaint"
              className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-brand text-brand-contrast text-[11px] sm:text-xs font-medium tracking-wide shadow-editorial group overflow-hidden border border-gold-light/40 hover:bg-brand-hover transition-all duration-300 whitespace-nowrap"
            >
              <span className="absolute inset-[2.5px] rounded-full border border-gold-light/25 pointer-events-none" />
              <span>ร้องเรียน/เสนอแนะ</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 text-gold-light">→</span>
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 -mr-1.5 flex items-center justify-center rounded-sm text-heading hover:bg-brand-soft/70 transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
              aria-label="เปิดเมนูนำทาง"
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between items-center relative">
                <span className="w-5 h-[1.5px] bg-heading rounded-full transition-all duration-200" />
                <span className="w-5 h-[1.5px] bg-heading rounded-full transition-all duration-200" />
                <span className="w-5 h-[1.5px] bg-heading rounded-full transition-all duration-200" />
              </div>
            </button>
          </div>
        </div>

        {/* Ticker bar right below header */}
        <div className="bg-anchor-bg text-anchor-gold py-1 sm:py-1.5 px-3 sm:px-4 overflow-hidden border-t border-gold/30 relative z-20">
          <div className="max-w-[1240px] mx-auto flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-contrast shrink-0 bg-brand px-1.5 sm:px-2 py-0.5 rounded-sm">
              ประกาศ
            </span>
            <div className="overflow-hidden relative flex-1 group">
              <div className="whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
                {[0, 1].map((dupIdx) => (
                  <div key={dupIdx} className="inline-flex items-center shrink-0" aria-hidden={dupIdx === 1}>
                    {displayTicker.map((item, idx) => (
                      <span key={`${dupIdx}-${idx}`} className="inline-flex items-center shrink-0">
                        <span>{item}</span>
                        <span className="opacity-40 mx-8 sm:mx-10">◆</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <Link to="/track" className="shrink-0 text-[10px] sm:text-[11px] underline text-anchor-text/85 hover:text-anchor-text whitespace-nowrap">
              ติดตามเรื่องร้องเรียน
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (Compact, crisp, non-bulky sheet) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-anchor-bg-deep/65 backdrop-blur-[2px] lg:hidden"
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              aria-label="เมนูนำทางหลัก"
              className="fixed top-0 right-0 bottom-0 z-50 w-[84vw] max-w-[320px] bg-anchor-bg text-anchor-text border-l border-gold/40 shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="px-4 py-3.5 border-b border-gold/25 flex items-center justify-between gap-3 shrink-0">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <img
                    src="/emblem.png"
                    alt="ตราองค์การนักเรียน"
                    data-emblem="true"
                    className="h-10 w-10 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-serif text-sm font-semibold text-anchor-text truncate leading-tight">
                      องค์การนักเรียน
                    </div>
                    <div className="text-[11px] text-anchor-gold truncate leading-tight mt-0.5">
                      โรงเรียนสาธิตมหาวิทยาลัยพะเยา
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 -mr-1 rounded-sm flex items-center justify-center text-anchor-text/80 hover:text-anchor-text hover:bg-anchor-text/10 transition-colors shrink-0"
                  aria-label="ปิดเมนู"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-0.5">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    location.pathname === '/'
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>หน้าหลัก</span>
                </Link>

                {/* About with optional expandable sub-links */}
                <div>
                  <div className="flex items-center">
                    <Link
                      to="/about/emblem"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex-1 flex items-center min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                        isActivePath('/about')
                          ? 'bg-brand/80 text-anchor-gold'
                          : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                      }`}
                    >
                      <span>เกี่ยวกับเรา</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileSubmenu(mobileSubmenu === 'about' ? null : 'about')}
                      aria-label="แสดงเมนูย่อยเกี่ยวกับเรา"
                      aria-expanded={mobileSubmenu === 'about'}
                      className="w-10 h-[42px] flex items-center justify-center text-anchor-gold/80 hover:text-anchor-gold hover:bg-anchor-text/5 rounded-sm transition-colors shrink-0"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${mobileSubmenu === 'about' ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {mobileSubmenu === 'about' && (
                    <div className="ml-3 pl-3 mt-0.5 mb-1.5 border-l border-gold/30 space-y-0.5">
                      {[
                        { to: '/about/emblem', label: 'ตราสัญลักษณ์' },
                        { to: '/about/authority', label: 'อำนาจหน้าที่' },
                        { to: '/about/board', label: 'คณะกรรมการองค์การนักเรียน' },
                        { to: '/about/advisors', label: 'คณะกรรมการที่ปรึกษา' },
                        { to: '/about/hall', label: 'ทำเนียบนายกองค์การนักเรียน' },
                      ].map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2 px-2.5 rounded-sm text-xs transition-colors ${
                            location.pathname === sub.to
                              ? 'text-anchor-gold font-semibold bg-anchor-text/5'
                              : 'text-anchor-text/75 hover:text-anchor-text hover:bg-anchor-text/5'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* News with optional expandable sub-links */}
                <div>
                  <div className="flex items-center">
                    <Link
                      to="/news"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex-1 flex items-center min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                        isActivePath('/news')
                          ? 'bg-brand/80 text-anchor-gold'
                          : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                      }`}
                    >
                      <span>ข่าวสารและประกาศ</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileSubmenu(mobileSubmenu === 'news' ? null : 'news')}
                      aria-label="แสดงหมวดหมู่ข่าวสาร"
                      aria-expanded={mobileSubmenu === 'news'}
                      className="w-10 h-[42px] flex items-center justify-center text-anchor-gold/80 hover:text-anchor-gold hover:bg-anchor-text/5 rounded-sm transition-colors shrink-0"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${mobileSubmenu === 'news' ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {mobileSubmenu === 'news' && (
                    <div className="ml-3 pl-3 mt-0.5 mb-1.5 border-l border-gold/30 space-y-0.5">
                      {[
                        { to: '/news/pr', label: 'ข่าวประชาสัมพันธ์' },
                        { to: '/news/activity', label: 'ภาพข่าวกิจกรรม' },
                        { to: '/news/regulation', label: 'ข้อบังคับ ระเบียบ คำสั่งและประกาศ' },
                        { to: '/news/knowledge', label: 'สาระน่ารู้' },
                        { to: '/news/video', label: 'คลิปวิดีโอ' },
                      ].map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2 px-2.5 rounded-sm text-xs transition-colors ${
                            location.pathname === sub.to
                              ? 'text-anchor-gold font-semibold bg-anchor-text/5'
                              : 'text-anchor-text/75 hover:text-anchor-text hover:bg-anchor-text/5'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/calendar')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>ปฏิทินกิจกรรม</span>
                </Link>

                <Link
                  to="/downloads"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/downloads')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>ดาวน์โหลดเอกสาร</span>
                </Link>

                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/track')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>ติดตามสถานะเรื่องร้องเรียน</span>
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/contact')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>ติดต่อเรา</span>
                </Link>
              </nav>

              {/* Drawer Footer */}
              <div className="px-4 py-4 border-t border-gold/25 space-y-3 shrink-0 bg-anchor-bg-deep">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-anchor-gold">โหมดสี</span>
                  <ThemeSwitcher variant="compact" onDarkSurface />
                </div>

                <Link
                  to="/complaint"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 bg-brand hover:bg-brand-hover text-brand-contrast rounded-sm border border-gold/60 font-medium text-xs tracking-wide transition-colors"
                >
                  ส่งเรื่องร้องเรียน / ข้อเสนอแนะ
                </Link>
                <p className="text-center text-[11px] text-anchor-text/60 leading-snug">
                  {SITE_CONFIG.name}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to push page content below fixed navbar + ticker */}
      <div className="h-[92px] sm:h-28" />
    </>
  );
};
