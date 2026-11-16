/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocLink } from './LocLink';
import { useLanguage } from '../../context/LanguageContext';

interface NavbarProps {
  tickerItems?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ tickerItems = [] }) => {
  const { t } = useTranslation();
  const { basePathname } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'news' | 'about' | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<'news' | 'about' | null>(null);

  const location = useLocation();

  // ปิดเมนูดรอปดาวน์และลิ้นชักมือถือเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setMobileSubmenu(null);
  }, [location.pathname]);

  // ล็อกการเลื่อนหน้าจอและรองรับปุ่ม Escape ขณะเปิดเมนูมือถือ
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

  // ซ่อนแถบนำทางเมื่อเลื่อนลง และแสดงเมื่อเลื่อนขึ้น
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setIsVisible(false);
        setActiveDropdown(null);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fallbackTicker = t('nav.defaultTicker', { returnObjects: true }) as string[];
  const displayTicker = tickerItems.length > 0 ? tickerItems : fallbackTicker;

  const isActivePath = (path: string) =>
    path === '/' ? basePathname === '/' : basePathname.startsWith(path);

  const aboutSubLinks = [
    { to: '/about/emblem', label: t('nav.aboutSub.emblem') },
    { to: '/about/authority', label: t('nav.aboutSub.authority') },
    { to: '/about/board', label: t('nav.aboutSub.board') },
    { to: '/about/advisors', label: t('nav.aboutSub.advisors') },
    { to: '/about/hall', label: t('nav.aboutSub.hall') },
  ];

  const newsSubLinks = [
    { to: '/news/pr', label: t('nav.newsSub.pr') },
    { to: '/news/activity', label: t('nav.newsSub.activity') },
    { to: '/news/regulation', label: t('nav.newsSub.regulation') },
    { to: '/news/knowledge', label: t('nav.newsSub.knowledge') },
    { to: '/news/video', label: t('nav.newsSub.video') },
  ];

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
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 relative z-30">
          {/* ส่วนที่ 1: ตราประจำองค์การนักเรียน */}
          <LocLink
            to="/"
            className="flex items-center group shrink-0 py-1"
            aria-label={t('nav.homeAria')}
          >
            <img
              src="/emblem.png"
              alt={t('about.emblem.imgAlt')}
              data-emblem="true"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            />
          </LocLink>

          {/* ส่วนที่ 2: เมนูนำทางหลักบนเดสก์ท็อป */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-text">
            <LocLink
              to="/"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                basePathname === '/' ? 'text-accent font-semibold' : ''
              }`}
            >
              {t('nav.home')}
            </LocLink>

            {/* เมนูย่อย: เกี่ยวกับเรา */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <LocLink
                to="/about/emblem"
                className={`flex items-center gap-1 hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2 ${
                  basePathname.startsWith('/about') ? 'text-accent font-semibold' : ''
                }`}
              >
                <span>{t('nav.about')}</span>
                <span className="text-[10px] text-gold-text">▾</span>
              </LocLink>

              <AnimatePresence>
                {activeDropdown === 'about' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-64 bg-surface border-2 border-gold p-3 shadow-2xl rounded-sm z-50"
                  >
                    {aboutSubLinks.map((sub) => (
                      <LocLink
                        key={sub.to}
                        to={sub.to}
                        className="block px-3 py-1.5 text-xs hover:bg-brand-soft rounded transition-colors text-heading"
                      >
                        {sub.label}
                      </LocLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* เมนูย่อย: ข่าวสาร */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('news')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <LocLink
                to="/news"
                className={`flex items-center gap-1 hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2 ${
                  basePathname.startsWith('/news') ? 'text-accent font-semibold' : ''
                }`}
              >
                <span>{t('nav.news')}</span>
                <span className="text-[10px] text-gold-text">▾</span>
              </LocLink>

              <AnimatePresence>
                {activeDropdown === 'news' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-72 bg-surface border-2 border-gold p-3 shadow-2xl rounded-sm z-50"
                  >
                    {newsSubLinks.map((sub) => (
                      <LocLink
                        key={sub.to}
                        to={sub.to}
                        className="block px-3 py-2 text-xs hover:bg-brand-soft rounded transition-colors"
                      >
                        <div className="font-medium text-heading">{sub.label}</div>
                      </LocLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <LocLink
              to="/calendar"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                basePathname === '/calendar' ? 'text-accent font-semibold' : ''
              }`}
            >
              {t('nav.calendar')}
            </LocLink>

            <LocLink
              to="/downloads"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                basePathname === '/downloads' ? 'text-accent font-semibold' : ''
              }`}
            >
              {t('nav.downloads')}
            </LocLink>

            <LocLink
              to="/contact"
              className={`hover:text-accent transition-colors whitespace-nowrap shrink-0 ${
                basePathname === '/contact' ? 'text-accent font-semibold' : ''
              }`}
            >
              {t('nav.contact')}
            </LocLink>
          </nav>

          {/* ส่วนที่ 3: ปุ่มสลับภาษา + ปุ่มสลับโหมดสี + ปุ่มร้องเรียน + ปุ่มเปิดเมนูมือถือ */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageSwitcher compact className="hidden sm:inline-flex" />
            <ThemeSwitcher variant="dropdown" />

            <LocLink
              to="/complaint"
              className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-brand text-brand-contrast text-[11px] sm:text-xs font-medium tracking-wide shadow-editorial group overflow-hidden border border-gold-light/40 hover:bg-brand-hover transition-all duration-300 whitespace-nowrap"
            >
              <span className="absolute inset-[2.5px] rounded-full border border-gold-light/25 pointer-events-none" />
              <span>{t('nav.reportButton')}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 text-gold-light">→</span>
            </LocLink>

            {/* ปุ่มเปิดเมนูมือถือ */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 -mr-1.5 flex items-center justify-center rounded-sm text-heading hover:bg-brand-soft/70 transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
              aria-label={t('nav.openMenu')}
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

        {/* แถบประกาศวิ่งใต้แถบนำทาง */}
        <div className="bg-anchor-bg text-anchor-gold py-1 sm:py-1.5 px-3 sm:px-4 overflow-hidden border-t border-gold/30 relative z-20">
          <div className="max-w-[1240px] mx-auto flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-contrast shrink-0 bg-brand px-1.5 sm:px-2 py-0.5 rounded-sm">
              {t('nav.tickerBadge')}
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
            <LocLink to="/track" className="shrink-0 text-[10px] sm:text-[11px] underline text-anchor-text/85 hover:text-anchor-text whitespace-nowrap">
              {t('nav.tickerTrackLink')}
            </LocLink>
          </div>
        </div>
      </header>

      {/* ลิ้นชักเมนูสำหรับหน้าจอมือถือและแท็บเล็ต */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-anchor-bg-deep/65 backdrop-blur-[2px] lg:hidden"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              aria-label={t('nav.mainMenuAria')}
              className="fixed top-0 right-0 bottom-0 z-50 w-[84vw] max-w-[320px] bg-anchor-bg text-anchor-text border-l border-gold/40 shadow-2xl flex flex-col lg:hidden"
            >
              {/* ส่วนหัวลิ้นชักเมนู */}
              <div className="px-4 py-3.5 border-b border-gold/25 flex items-center justify-between gap-3 shrink-0">
                <LocLink
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <img
                    src="/emblem.png"
                    alt={t('about.emblem.imgAlt')}
                    data-emblem="true"
                    className="h-10 w-10 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-serif text-sm font-semibold text-anchor-text truncate leading-tight">
                      {t('site.shortNameNav')}
                    </div>
                    <div className="text-[11px] text-anchor-gold truncate leading-tight mt-0.5">
                      {t('site.schoolName')}
                    </div>
                  </div>
                </LocLink>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 -mr-1 rounded-sm flex items-center justify-center text-anchor-text/80 hover:text-anchor-text hover:bg-anchor-text/10 transition-colors shrink-0"
                  aria-label={t('nav.closeMenu')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* รายการเมนูนำทาง */}
              <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-0.5">
                <LocLink
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    basePathname === '/'
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>{t('nav.home')}</span>
                </LocLink>

                {/* เมนูย่อย: เกี่ยวกับเรา */}
                <div>
                  <div className="flex items-center">
                    <LocLink
                      to="/about/emblem"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex-1 flex items-center min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                        isActivePath('/about')
                          ? 'bg-brand/80 text-anchor-gold'
                          : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                      }`}
                    >
                      <span>{t('nav.about')}</span>
                    </LocLink>
                    <button
                      type="button"
                      onClick={() => setMobileSubmenu(mobileSubmenu === 'about' ? null : 'about')}
                      aria-label={t('nav.toggleAboutSub')}
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
                      {aboutSubLinks.map((sub) => (
                        <LocLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2 px-2.5 rounded-sm text-xs transition-colors ${
                            basePathname === sub.to
                              ? 'text-anchor-gold font-semibold bg-anchor-text/5'
                              : 'text-anchor-text/75 hover:text-anchor-text hover:bg-anchor-text/5'
                          }`}
                        >
                          {sub.label}
                        </LocLink>
                      ))}
                    </div>
                  )}
                </div>

                {/* เมนูย่อย: ข่าวสารและประกาศ */}
                <div>
                  <div className="flex items-center">
                    <LocLink
                      to="/news"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex-1 flex items-center min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                        isActivePath('/news')
                          ? 'bg-brand/80 text-anchor-gold'
                          : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                      }`}
                    >
                      <span>{t('nav.newsAndAnnouncements')}</span>
                    </LocLink>
                    <button
                      type="button"
                      onClick={() => setMobileSubmenu(mobileSubmenu === 'news' ? null : 'news')}
                      aria-label={t('nav.toggleNewsSub')}
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
                      {newsSubLinks.map((sub) => (
                        <LocLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2 px-2.5 rounded-sm text-xs transition-colors ${
                            basePathname === sub.to
                              ? 'text-anchor-gold font-semibold bg-anchor-text/5'
                              : 'text-anchor-text/75 hover:text-anchor-text hover:bg-anchor-text/5'
                          }`}
                        >
                          {sub.label}
                        </LocLink>
                      ))}
                    </div>
                  )}
                </div>

                <LocLink
                  to="/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/calendar')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>{t('nav.calendar')}</span>
                </LocLink>

                <LocLink
                  to="/downloads"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/downloads')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>{t('nav.downloadsFull')}</span>
                </LocLink>

                <LocLink
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/track')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>{t('nav.trackComplaint')}</span>
                </LocLink>

                <LocLink
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[42px] px-3 py-2 rounded-sm text-[15px] font-medium whitespace-nowrap transition-colors ${
                    isActivePath('/contact')
                      ? 'bg-brand/80 text-anchor-gold'
                      : 'text-anchor-text/90 hover:bg-anchor-text/5 hover:text-anchor-text'
                  }`}
                >
                  <span>{t('nav.contactUs')}</span>
                </LocLink>
              </nav>

              {/* ส่วนท้ายลิ้นชักเมนู: สลับภาษา + สลับโหมดสี + ปุ่มส่งเรื่อง */}
              <div className="px-4 py-4 border-t border-gold/25 space-y-3 shrink-0 bg-anchor-bg-deep">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-anchor-gold">{t('nav.languageLabel')}</span>
                  <LanguageSwitcher onDarkSurface />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-anchor-gold">{t('nav.themeLabel')}</span>
                  <ThemeSwitcher variant="compact" onDarkSurface />
                </div>

                <LocLink
                  to="/complaint"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 bg-brand hover:bg-brand-hover text-brand-contrast rounded-sm border border-gold/60 font-medium text-xs tracking-wide transition-colors"
                >
                  {t('nav.reportFull')}
                </LocLink>
                <p className="text-center text-[11px] text-anchor-text/60 leading-snug">
                  {t('site.name')}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ตัวเว้นระยะด้านบนให้พ้นความสูงแถบนำทาง */}
      <div className="h-[92px] sm:h-28" />
    </>
  );
};
