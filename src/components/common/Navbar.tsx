/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_CONFIG } from '../../config/site';

interface NavbarProps {
  tickerItems?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ tickerItems = [] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'news' | 'about' | null>(null);

  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#B8923A]/30 shadow-editorial-sm'
            : 'bg-[#FAF7F0] border-b border-[#4B1F7A]/10'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between gap-8 relative z-30">
          {/* Zone 1: Emblem Brand Mark directly (Without redundant duplicate text) */}
          <Link
            to="/"
            className="flex items-center group shrink-0 py-1"
            aria-label="หน้าหลัก องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
          >
            <img
              src="/emblem.png"
              alt="ตราองค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
              className="h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            />
          </Link>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#1B1226]">
            <Link
              to="/"
              className={`hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/' ? 'text-[#4B1F7A] font-semibold' : ''
              }`}
            >
              หน้าหลัก
            </Link>

            {/* Dropdown: ข่าวสาร */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('news')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/news"
                className={`flex items-center gap-1 hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 py-2 ${
                  location.pathname.startsWith('/news') ? 'text-[#4B1F7A] font-semibold' : ''
                }`}
              >
                <span>ข่าวสาร</span>
                <span className="text-[10px] text-[#B8923A]">▾</span>
              </Link>

              {/* Mega panel dropdown floating cleanly above ticker with z-50 */}
              <AnimatePresence>
                {activeDropdown === 'news' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-72 bg-[#FAF7F0] border-2 border-[#B8923A] p-3 shadow-2xl rounded-sm z-50"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-[#9C7A2B] font-semibold px-3 py-1 border-b border-[#4B1F7A]/10 mb-1">
                      หมวดหมู่ข่าวสาร
                    </div>
                    <Link to="/news/pr" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">ข่าวประชาสัมพันธ์</div>
                      <div className="text-[11px] text-[#1B1226]/60">ประกาศทั่วไปและข่าวสารจากองค์การ</div>
                    </Link>
                    <Link to="/news/activity" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">ภาพข่าวกิจกรรม</div>
                      <div className="text-[11px] text-[#1B1226]/60">ภาพบรรยากาศและบันทึกกิจกรรมนักเรียน</div>
                    </Link>
                    <Link to="/news/regulation" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">ข้อบังคับและระเบียบ</div>
                      <div className="text-[11px] text-[#1B1226]/60">ธรรมนูญและกฎระเบียบที่เกี่ยวข้อง</div>
                    </Link>
                    <Link to="/news/order" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">คำสั่งและประกาศ</div>
                      <div className="text-[11px] text-[#1B1226]/60">คำสั่งแต่งตั้งและประกาศทางการ</div>
                    </Link>
                    <Link to="/news/knowledge" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">สาระน่ารู้</div>
                      <div className="text-[11px] text-[#1B1226]/60">บทความและสาระที่เป็นประโยชน์</div>
                    </Link>
                    <Link to="/news/video" className="block px-3 py-2 text-xs hover:bg-[#EDE6F5] rounded transition-colors">
                      <div className="font-medium text-[#2A1245]">คลิปวิดีโอ</div>
                      <div className="text-[11px] text-[#1B1226]/60">วิดีโอสรุปกิจกรรมและสื่อมัลติมีเดีย</div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/calendar"
              className={`hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/calendar' ? 'text-[#4B1F7A] font-semibold' : ''
              }`}
            >
              ปฏิทินกิจกรรม
            </Link>

            <Link
              to="/downloads"
              className={`hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/downloads' ? 'text-[#4B1F7A] font-semibold' : ''
              }`}
            >
              ดาวน์โหลด
            </Link>

            {/* Dropdown: เกี่ยวกับเรา */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/about/emblem"
                className={`flex items-center gap-1 hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 py-2 ${
                  location.pathname.startsWith('/about') ? 'text-[#4B1F7A] font-semibold' : ''
                }`}
              >
                <span>เกี่ยวกับเรา</span>
                <span className="text-[10px] text-[#B8923A]">▾</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'about' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-64 bg-[#FAF7F0] border-2 border-[#B8923A] p-3 shadow-2xl rounded-sm z-50"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-[#9C7A2B] font-semibold px-3 py-1 border-b border-[#4B1F7A]/10 mb-1">
                      ข้อมูลองค์การ
                    </div>
                    <Link to="/about/emblem" className="block px-3 py-1.5 text-xs hover:bg-[#EDE6F5] rounded transition-colors text-[#2A1245]">
                      ตราสัญลักษณ์และความหมาย
                    </Link>
                    <Link to="/about/authority" className="block px-3 py-1.5 text-xs hover:bg-[#EDE6F5] rounded transition-colors text-[#2A1245]">
                      อำนาจหน้าที่และธรรมนูญ
                    </Link>
                    <Link to="/about/board" className="block px-3 py-1.5 text-xs hover:bg-[#EDE6F5] rounded transition-colors text-[#2A1245]">
                      คณะกรรมการองค์การนักเรียน
                    </Link>
                    <Link to="/about/advisors" className="block px-3 py-1.5 text-xs hover:bg-[#EDE6F5] rounded transition-colors text-[#2A1245]">
                      ครูที่ปรึกษาองค์การ
                    </Link>
                    <Link to="/about/hall" className="block px-3 py-1.5 text-xs hover:bg-[#EDE6F5] rounded transition-colors text-[#2A1245]">
                      ทำเนียบนายกองค์การนักเรียน
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/transparency"
              className={`hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/transparency' ? 'text-[#4B1F7A] font-semibold' : ''
              }`}
            >
              ความโปร่งใส
            </Link>

            <Link
              to="/contact"
              className={`hover:text-[#4B1F7A] transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/contact' ? 'text-[#4B1F7A] font-semibold' : ''
              }`}
            >
              ติดต่อ
            </Link>
          </nav>

          {/* Zone 3: Primary CTA capsule button + Mobile trigger */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/complaint"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium tracking-wide shadow-editorial group overflow-hidden border border-[#D9B867]/40 hover:bg-[#2A1245] transition-all duration-300"
            >
              <span className="absolute inset-[2.5px] rounded-full border border-[#D9B867]/25 pointer-events-none" />
              <span>ร้องเรียน/เสนอแนะ</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#D9B867]">→</span>
            </Link>

            {/* Mobile Hamburger (2 thin lines that rotate into X) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#2A1245] focus:outline-none"
              aria-label="เปิดเมนูนำทาง"
            >
              <div className="w-6 h-5 flex flex-col justify-between items-center relative">
                <span
                  className={`w-6 h-[1.5px] bg-[#2A1245] transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-2 bg-[#FAF7F0]' : ''
                  }`}
                />
                <span
                  className={`w-6 h-[1.5px] bg-[#2A1245] transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-2 bg-[#FAF7F0]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Ticker bar right below header */}
        <div className="bg-[#2A1245] text-[#D9B867] py-1.5 px-4 overflow-hidden border-t border-[#B8923A]/30 relative z-20">
          <div className="max-w-[1240px] mx-auto flex items-center gap-3 text-xs">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#FAF7F0] shrink-0 bg-[#4B1F7A] px-2 py-0.5 rounded-sm">
              ประกาศ
            </span>
            <div className="overflow-hidden relative flex-1 group">
              <div className="whitespace-nowrap inline-block animate-marquee group-hover:[animation-play-state:paused]">
                {displayTicker.map((item, idx) => (
                  <span key={idx} className="mr-12 inline-block">
                    {item} <span className="opacity-40 ml-12">◆</span>
                  </span>
                ))}
              </div>
            </div>
            <Link to="/track" className="shrink-0 text-[11px] underline text-[#FAF7F0]/80 hover:text-[#FAF7F0] whitespace-nowrap">
              ติดตามเรื่องร้องเรียน
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Full screen violet-900 overlay sliding in from right) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[#2A1245] text-[#FAF7F0] p-8 flex flex-col justify-between lg:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-6 border-b border-[#B8923A]/30">
              <img
                src="/emblem.png"
                alt="ตราองค์การนักเรียน"
                className="h-16 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#FAF7F0] text-2xl p-2"
                aria-label="ปิดเมนู"
              >
                ✕
              </button>
            </div>

            <div className="py-8 space-y-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                หน้าหลัก
              </Link>
              <Link
                to="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ข่าวสารและประกาศ
              </Link>
              <Link
                to="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ปฏิทินกิจกรรม
              </Link>
              <Link
                to="/downloads"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ดาวน์โหลดเอกสาร
              </Link>
              <Link
                to="/about/emblem"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                เกี่ยวกับองค์การนักเรียน
              </Link>
              <Link
                to="/transparency"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ความโปร่งใสและงบประมาณ
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ติดตามสถานะเรื่องร้องเรียน
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-serif text-2xl text-[#FAF7F0] hover:text-[#D9B867] transition-colors"
              >
                ติดต่อองค์การ
              </Link>
            </div>

            <div className="pt-6 border-t border-[#B8923A]/30 flex flex-col gap-3">
              <Link
                to="/complaint"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-[#4B1F7A] text-[#FAF7F0] rounded-full border border-[#D9B867]/50 font-medium text-sm"
              >
                ส่งเรื่องร้องเรียน / ข้อเสนอแนะ
              </Link>
              <p className="text-center text-xs text-[#FAF7F0]/60">
                {SITE_CONFIG.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to push page content below fixed navbar + ticker */}
      <div className="h-28" />
    </>
  );
};
