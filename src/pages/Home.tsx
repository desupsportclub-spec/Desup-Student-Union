/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, animate } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem, EventItem, PersonItem, BannerItem } from '../types';
import { formatThaiDate, getThaiDateParts, formatNumber } from '../lib/format';
import { SectionEyebrow, SectionDivider, CornerBracket } from '../components/common/Ornament';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { Emblem } from '../components/common/Emblem';
import { HeroBannerSlider } from '../components/home/HeroBannerSlider';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const Home: React.FC = () => {
  const { academicYearTH, presidentHeadline, presidentMessage } = useSiteSettings();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [president, setPresident] = useState<PersonItem | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<{ src: string; title: string }[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    visits: 0,
    complaintsTotal: 0,
    resolvedPercent: 100,
    eventsCount: 0
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Embla Carousel for upcoming events
  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true });

  // Hero Parallax on subtle gold background lines
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 600], [0, 80]);

  // Magnetic button on desktop
  const magneticBtnRef = useRef<HTMLAnchorElement>(null);
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });

  const handleMagneticMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!magneticBtnRef.current) return;
    const rect = magneticBtnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.25;
    const deltaY = (e.clientY - centerY) * 0.25;
    setBtnOffset({ x: Math.max(-8, Math.min(8, deltaX)), y: Math.max(-8, Math.min(8, deltaY)) });
  };

  const handleMagneticLeave = () => {
    setBtnOffset({ x: 0, y: 0 });
  };

  // Load live data from Firestore (without composite-index queries)
  useEffect(() => {
    async function loadData() {
      try {
        // 0. Banners for Hero Slider
        try {
          const bannersSnap = await getDocs(collection(db, 'banners'));
          const bannersList: BannerItem[] = [];
          bannersSnap.forEach(d => {
            const item = { id: d.id, ...d.data() } as BannerItem;
            if (item.active !== false) {
              bannersList.push(item);
            }
          });
          bannersList.sort((a, b) => (a.order || 0) - (b.order || 0));
          setBanners(bannersList);
        } catch (bErr) {
          console.warn("Banners query warning:", bErr);
        }

        // 1. News: published only (sorted client-side to avoid composite index dependency)
        const newsQuery = query(
          collection(db, 'news'),
          where('published', '==', true)
        );
        const newsSnap = await getDocs(newsQuery);
        const newsList: NewsItem[] = [];
        newsSnap.forEach(d => {
          newsList.push({ id: d.id, ...d.data() } as NewsItem);
        });
        newsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        if (newsList.length > 0) {
          const pinned = newsList.find(n => n.pinned) || newsList[0];
          setFeaturedNews(pinned);
          setRecentNews(newsList.filter(n => n.id !== pinned.id).slice(0, 4));
        }

        // 4. Activity Gallery from published activity news
        const photos: { src: string; title: string }[] = [];
        newsList
          .filter(n => n.category === 'activity')
          .slice(0, 6)
          .forEach(item => {
            const src = item.coverImage?.url || item.coverUrl;
            if (src) {
              photos.push({ src, title: item.title });
            }
          });
        setGalleryPhotos(photos);

        // 2. Events: published only (sorted client-side)
        const eventsQuery = query(
          collection(db, 'events'),
          where('published', '==', true)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const eventsList: EventItem[] = [];
        eventsSnap.forEach(d => {
          eventsList.push({ id: d.id, ...d.data() } as EventItem);
        });
        eventsList.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''));
        setUpcomingEvents(eventsList.slice(0, 6));

        // 3. President: resolve latest นายกองค์การนักเรียน across 'president' OR 'board' roles
        const peopleSnap = await getDocs(collection(db, 'people'));
        const candidates: PersonItem[] = [];
        peopleSnap.forEach(d => {
          const p = { id: d.id, ...d.data() } as PersonItem;
          const pos = (p.position || '').trim();
          const isVice = pos.includes('อุปนายก') || pos.includes('รองนายก') || pos.includes('รองประธาน');
          const isPresidentTitle = (pos.includes('นายก') || pos.includes('ประธาน')) && !isVice;
          if (p.role === 'president' || isPresidentTitle) {
            candidates.push(p);
          }
        });
        candidates.sort((a, b) => {
          const yrDiff = (b.yearTH || '').localeCompare(a.yearTH || '');
          if (yrDiff !== 0) return yrDiff;
          const timeA = a.updatedAt || a.createdAt || '';
          const timeB = b.updatedAt || b.createdAt || '';
          if (timeB !== timeA) return timeB.localeCompare(timeA);
          return (a.order || 999) - (b.order || 999);
        });
        if (candidates.length > 0) {
          setPresident(candidates[0]);
        } else {
          setPresident(null);
        }

        // 5. Site visits and complaint statistics
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        let totalVisits = 0;
        if (settingsSnap.exists()) {
          totalVisits = settingsSnap.data().totalVisits || 0;
        }

        let totalComplaints = 0;
        let resolvedCount = 0;
        try {
          const complaintsSnap = await getDocs(collection(db, 'complaints'));
          complaintsSnap.forEach(d => {
            totalComplaints++;
            const data = d.data();
            if (data.status === 'resolved') resolvedCount++;
          });
        } catch {
          // Non-admin listing is blocked by Firestore security rules
        }

        const percent = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;

        setStats({
          visits: totalVisits,
          complaintsTotal: totalComplaints,
          resolvedPercent: percent,
          eventsCount: eventsList.length
        });

      } catch (err) {
        console.warn("Firestore data load warning:", err);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* ========================================================
          00. HERO BANNER SLIDER (Full Width Prominent Carousel)
         ======================================================== */}
      <HeroBannerSlider banners={banners} />

      {/* ========================================================
          HERO EDITORIAL SECTION (Asymmetric 12-column grid: 7 cols left / 5 cols right)
         ======================================================== */}
      <section className="relative pt-2 md:pt-6 overflow-hidden">
        {/* Subtle decorative Thai line art background with gentle parallax */}
        <motion.div
          style={{ y: heroParallaxY }}
          className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 flex items-center justify-center"
        >
          <svg width="800" height="800" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="190" stroke="#B8923A" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="140" stroke="#B8923A" strokeWidth="1" />
            <rect x="100" y="100" width="200" height="200" stroke="#B8923A" strokeWidth="1" transform="rotate(45 200 200)" />
          </svg>
        </motion.div>

        <div className="max-w-[1240px] mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left 7 Columns: Editorial Headline + Mask Reveal */}
            <div className="lg:col-span-7 space-y-6">
              <SectionEyebrow thText="องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา" enText="STUDENT COUNCIL" />

              <div className="space-y-2">
                <div className="overflow-hidden">
                  <motion.h1
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold text-[#1B1226] leading-[1.25]"
                  >
                    เสียงของนักเรียน
                  </motion.h1>
                </div>
                <div className="overflow-hidden">
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold text-[#1B1226] leading-[1.25]"
                  >
                    สร้างโรงเรียนที่เรา <span className="italic text-[#9C7A2B] font-serif">ภาคภูมิใจ</span>
                  </motion.div>
                </div>
              </div>

              <p className="text-base md:text-lg text-[#1B1226]/80 leading-relaxed max-w-xl">
                องค์การนักเรียน ภายใต้การกำกับดูแลของงานกิจการนักเรียน มุ่งมั่นรักษาผลประโยชน์และสิทธิอันชอบธรรมของนักเรียน ขับเคลื่อนกิจกรรมตามอัตลักษณ์ และรับฟังทุกเสียงของนักเรียนสาธิต มพ.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                {/* Primary CTA with magnetic offset */}
                <motion.div
                  style={{ x: btnOffset.x, y: btnOffset.y }}
                  className="inline-block"
                >
                  <Link
                    ref={magneticBtnRef}
                    onMouseMove={handleMagneticMove}
                    onMouseLeave={handleMagneticLeave}
                    to="/complaint"
                    className="relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#4B1F7A] text-[#FAF7F0] text-sm font-medium tracking-wide shadow-editorial group overflow-hidden border border-[#D9B867]/40 hover:bg-[#2A1245] transition-all duration-300"
                  >
                    <span className="absolute inset-[3px] rounded-full border border-[#D9B867]/25 pointer-events-none" />
                    <span>ส่งเสียงถึงองค์การ</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#D9B867]">→</span>
                  </Link>
                </motion.div>

                {/* Secondary link with expanding gold underline */}
                <Link
                  to="/news"
                  className="btn-secondary-link text-sm font-medium text-[#2A1245] hover:text-[#4B1F7A] transition-colors"
                >
                  <span>ดูข่าวล่าสุด</span>
                  <span className="text-[#B8923A]">→</span>
                </Link>
              </div>
            </div>

            {/* Right 5 Columns: 4:5 Visual Frame with offset gold border */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Offset gold frame behind the image (offset by 8px) */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-3 translate-y-3 border border-[#B8923A]/60 rounded-sm pointer-events-none z-0"
                />

                {/* Main 4:5 image container */}
                <div className="relative aspect-[4/5] bg-stone-200 border border-[#4B1F7A]/20 rounded-sm overflow-hidden z-10 shadow-editorial">
                  {featuredNews?.coverImage?.url || featuredNews?.coverUrl ? (
                    <img
                      src={featuredNews?.coverImage?.url || featuredNews?.coverUrl}
                      alt={featuredNews.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2A1245] text-[#FAF7F0] p-8 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                        <Emblem size={240} />
                      </div>
                      <div className="relative z-10 space-y-2">
                        <span className="text-[11px] uppercase tracking-widest text-[#D9B867]">
                          DEMONSTRATION SCHOOL OF UNIVERSITY OF PHAYAO
                        </span>
                        <h2 className="font-serif text-2xl text-[#FAF7F0] leading-snug">
                          มุ่งมั่นพัฒนาวิชาการ ควบคู่กิจกรรมสร้างสรรค์คุณธรรม
                        </h2>
                      </div>
                      <div className="relative z-10 border-t border-[#B8923A]/30 pt-4 flex items-center justify-between text-xs text-[#FAF7F0]/70">
                        <span>สธ.มพ</span>
                        <span>โรงเรียนสาธิตมหาวิทยาลัยพะเยา</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          01. ข่าวเด่น & ข่าวรอง (Lead story left + 4 vertical items right)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#B8923A]/30">
          <div>
            <SectionEyebrow number="01" enText="NEWS" thText="ข่าวประชาสัมพันธ์" />
            <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
              ข่าวสารและความเคลื่อนไหว
            </h2>
          </div>
          <Link to="/news" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-4 md:mt-0">
            <span>ข่าวทั้งหมด</span>
            <span className="text-[#B8923A]">→</span>
          </Link>
        </div>

        {featuredNews ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Large Featured Card */}
            <div className="lg:col-span-7">
              <Link
                to={`/news/read/${featuredNews.id}`}
                className="group block relative border border-[#4B1F7A]/15 bg-[#FAF7F0] p-6 rounded-sm shadow-editorial transition-all duration-300 hover:border-[#B8923A]/70"
              >
                <CornerBracket position="top-left" />
                <CornerBracket position="top-right" />
                <CornerBracket position="bottom-left" />
                <CornerBracket position="bottom-right" />

                <div className="aspect-[16/9] bg-stone-100 overflow-hidden mb-5 rounded-sm relative">
                  {featuredNews.coverImage?.url || featuredNews.coverUrl ? (
                    <img
                      src={featuredNews.coverImage?.url || featuredNews.coverUrl}
                      alt={featuredNews.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center text-[#4B1F7A]">
                      <Emblem size={64} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#1B1226]/60">
                    <NewsCategoryBadge category={featuredNews.category} />
                    <span aria-hidden="true">·</span>
                    <span>{formatThaiDate(featuredNews.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>อ่าน {formatNumber(featuredNews.views)} ครั้ง</span>
                  </div>

                  <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2">
                    {featuredNews.title}
                  </h3>

                  <p className="text-xs md:text-sm text-[#1B1226]/70 line-clamp-2 leading-relaxed">
                    {featuredNews.excerpt || 'คลิกเพื่ออ่านรายละเอียดเนื้อหาข่าวสารฉบับเต็ม'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right 5 cols: 4 Vertical Secondary List Items */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {recentNews.length > 0 ? (
                recentNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/read/${item.id}`}
                    className="group flex gap-4 p-3.5 border border-[#4B1F7A]/10 hover:border-[#B8923A]/50 bg-[#FAF7F0] rounded-sm transition-all duration-300"
                  >
                    <div className="w-24 h-20 bg-stone-100 rounded-sm shrink-0 overflow-hidden">
                      {item.coverImage?.url || item.coverUrl ? (
                        <img
                          src={item.coverImage?.url || item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center text-[#4B1F7A]/50">
                          <Emblem size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#1B1226]/60">
                        <NewsCategoryBadge category={item.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatThaiDate(item.createdAt, true)}</span>
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-[#4B1F7A]/20 rounded-sm text-xs text-[#1B1226]/60">
                  กำลังรอการเผยแพร่ข่าวสารเพิ่มเติม
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/40">
            <p className="font-serif text-lg text-[#2A1245] mb-2">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</p>
            <p className="text-xs text-[#1B1226]/60">สามารถติดตามข่าวสารและการประกาศกิจกรรมที่จะอัปเดตผ่านหน้านี้เร็ว ๆ นี้</p>
          </div>
        )}
      </section>

      {/* ========================================================
          02. สถิติความโปร่งใส (Dark violet-900 section with count-up)
         ======================================================== */}
      <section className="bg-[#2A1245] text-[#FAF7F0] py-20 relative overflow-hidden border-y border-[#B8923A]/30">
        <div className="max-w-[1240px] mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-12 text-center max-w-xl mx-auto space-y-2">
            <SectionEyebrow number="02" enText="TRANSPARENCY & IMPACT" thText="สถิติและการดำเนินงาน" light />
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#FAF7F0]">
              เปิดเผย โปร่งใส มุ่งมั่นเพื่อนักเรียน
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            {/* Stat 1: Visits */}
            <div className="space-y-2 border-r border-[#B8923A]/20 last:border-none">
              <div className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#D9B867] tabular-numbers font-medium">
                {formatNumber(stats.visits)}
              </div>
              <div className="text-xs tracking-wider text-[#FAF7F0]/80 uppercase">ผู้เข้าชมสะสม</div>
            </div>

            {/* Stat 2: Total Complaints */}
            <div className="space-y-2 border-r border-[#B8923A]/20 last:border-none">
              <div className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#FAF7F0] tabular-numbers font-medium">
                {formatNumber(stats.complaintsTotal)}
              </div>
              <div className="text-xs tracking-wider text-[#FAF7F0]/80 uppercase">เรื่องร้องเรียนทั้งหมด</div>
            </div>

            {/* Stat 3: Resolved percentage */}
            <div className="space-y-2 border-r border-[#B8923A]/20 last:border-none">
              <div className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#D9B867] tabular-numbers font-medium">
                {stats.resolvedPercent}%
              </div>
              <div className="text-xs tracking-wider text-[#FAF7F0]/80 uppercase">ดำเนินการเสร็จสิ้น</div>
            </div>

            {/* Stat 4: Activities this year */}
            <div className="space-y-2">
              <div className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#FAF7F0] tabular-numbers font-medium">
                {formatNumber(stats.eventsCount)}
              </div>
              <div className="text-xs tracking-wider text-[#FAF7F0]/80 uppercase">
                กิจกรรมส่งเสริมนักเรียนตลอดปี
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          03. กิจกรรมที่กำลังจะมาถึง (Upcoming Events carousel)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#B8923A]/30">
          <div>
            <SectionEyebrow number="03" enText="SCHEDULE" thText="ปฏิทินกิจกรรม" />
            <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
              กิจกรรมที่กำลังจะมาถึง
            </h2>
          </div>
          <Link to="/calendar" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-4 md:mt-0">
            <span>ดูปฏิทินทั้งหมด</span>
            <span className="text-[#B8923A]">→</span>
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {upcomingEvents.map((evt) => {
                const dateParts = getThaiDateParts(evt.startAt);
                return (
                  <div
                    key={evt.id}
                    className="flex-[0_0_88%] sm:flex-[0_0_46%] lg:flex-[0_0_32%] min-w-0 border border-[#4B1F7A]/15 bg-[#FAF7F0] p-6 rounded-sm shadow-editorial flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-[#EDE6F5] border border-[#B8923A]/30 p-2 text-center rounded-sm min-w-[56px]">
                          <div className="font-serif text-2xl font-bold text-[#4B1F7A] leading-none">
                            {dateParts.day}
                          </div>
                          <div className="text-[11px] text-[#9C7A2B] font-medium mt-1">
                            {dateParts.monthShort}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9C7A2B] font-medium">
                            {evt.type === 'sport' ? 'กีฬา' : evt.type === 'academic' ? 'วิชาการ' : evt.type === 'art' ? 'ศิลปวัฒนธรรม' : evt.type === 'volunteer' ? 'จิตอาสา' : 'การประชุม'}
                          </span>
                          <h3 className="font-serif text-lg font-semibold text-[#1B1226] line-clamp-2 mt-1">
                            {evt.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-[#1B1226]/70 line-clamp-2 mb-4 leading-relaxed">
                        {evt.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#4B1F7A]/10 text-xs text-[#1B1226]/60 flex items-center justify-between">
                      <span>📍 {evt.location || 'โรงเรียนสาธิต มพ.'}</span>
                      <span className="text-[#9C7A2B]">พ.ศ. {dateParts.yearBE}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/40">
            <p className="font-serif text-lg text-[#2A1245] mb-2">ยังไม่มีกิจกรรมที่กำหนดไว้ในเร็ว ๆ นี้</p>
            <p className="text-xs text-[#1B1226]/60">สามารถตรวจสอบกำหนดการในหน้าปฏิทินกิจกรรมฉบับเต็มได้</p>
          </div>
        )}
      </section>

      {/* ========================================================
          04. ทางลัดบริการ (Editorial Book Index Style)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-6 md:px-12">
        <div className="mb-10 pb-4 border-b border-[#B8923A]/30">
          <SectionEyebrow number="04" enText="SERVICES" thText="ทางลัดบริการนักเรียน" />
          <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
            สารบัญบริการและช่องทางติดต่อ
          </h2>
        </div>

        <div className="divide-y divide-[#B8923A]/25 border-y border-[#B8923A]/25">
          {[
            { num: '01', title: 'ส่งเรื่องร้องเรียน / ข้อเสนอแนะ', desc: 'สะท้อนปัญหา ส่งเรื่องร้องเรียนแบบไม่ระบุตัวตน หรือเสนอแนวคิดพัฒนาโรงเรียน', link: '/complaint' },
            { num: '02', title: 'ติดตามสถานะเรื่องร้องเรียน', desc: `ตรวจสอบความคืบหน้าการดำเนินงานของเรื่องร้องเรียนด้วยรหัสติดตาม (SC-${academicYearTH}-XXXXXX)`, link: '/track' },
            { num: '03', title: 'ดาวน์โหลดแบบฟอร์มและเอกสาร', desc: 'แบบฟอร์มขอจัดกิจกรรม รายงานการประชุม และเอกสารทางการขององค์การ', link: '/downloads' },
            { num: '04', title: 'ปฏิทินกิจกรรมตลอดปีการศึกษา', desc: 'ตารางกิจกรรมวิชาการ กีฬา ศิลปวัฒนธรรม และวันสำคัญของโรงเรียน', link: '/calendar' },
            { num: '05', title: 'อำนาจหน้าที่และประกาศองค์การนักเรียน', desc: 'ประกาศโรงเรียนสาธิตมหาวิทยาลัยพะเยา เรื่อง องค์การนักเรียน พ.ศ. ๒๕๖๙ อำนาจหน้าที่ โครงสร้าง และคุณสมบัติคณะกรรมการ', link: '/about/authority' },
            { num: '06', title: 'ติดต่อสอบถามองค์การนักเรียน', desc: 'สถานที่ตั้ง เบอร์โทรศัพท์ อีเมล และช่องทางโซเชียลมีเดีย', link: '/contact' },
          ].map((item) => (
            <Link
              key={item.num}
              to={item.link}
              className="group py-5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#EDE6F5]/50 transition-colors duration-200"
            >
              <div className="flex items-start sm:items-center gap-6">
                <span className="font-serif text-lg text-[#9C7A2B] font-medium w-8">
                  {item.num}
                </span>
                <div>
                  <h3 className="font-serif text-base md:text-lg font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#1B1226]/60 mt-0.5 max-w-2xl">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-[#9C7A2B] group-hover:translate-x-2 transition-transform duration-200 self-end sm:self-center font-serif">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================
          05. แกลเลอรีภาพกิจกรรม (Masonry preview with lightbox)
         ======================================================== */}
      {galleryPhotos.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#B8923A]/30">
            <div>
              <SectionEyebrow number="05" enText="GALLERY" thText="ภาพข่าวกิจกรรม" />
              <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
                ประมวลภาพบรรยากาศ
              </h2>
            </div>
            <Link to="/news/activity" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-4 md:mt-0">
              <span>ภาพกิจกรรมทั้งหมด</span>
              <span className="text-[#B8923A]">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPhotos.map((photo, index) => (
              <div
                key={index}
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                className="cursor-pointer group relative overflow-hidden bg-stone-100 border border-[#4B1F7A]/15 rounded-sm aspect-[4/3]"
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#2A1245]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-white text-xs">
                  <span className="line-clamp-2 font-medium">{photo.title}</span>
                </div>
              </div>
            ))}
          </div>

          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={galleryPhotos.map(p => ({ src: p.src, title: p.title }))}
          />
        </section>
      )}

      {/* ========================================================
          06. สารจากนายกองค์การนักเรียน (Editorial portrait overlap)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-6 md:px-12 pb-12">
        <div className="bg-[#FAF7F0] border border-[#B8923A]/40 p-8 md:p-14 rounded-sm shadow-editorial relative overflow-hidden">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Left 4 cols: President photo with greyscale-to-color transition */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-48 h-60 md:w-56 md:h-72 border border-[#B8923A] rounded-sm overflow-hidden shadow-editorial bg-stone-100">
                {president?.photo?.url || president?.photoUrl ? (
                  <img
                    src={president.photo?.url || president.photoUrl}
                    alt={president.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-[#EDE6F5] flex flex-col items-center justify-center p-4 text-center">
                    <Emblem size={56} />
                    <span className="text-xs text-[#4B1F7A] mt-3 font-medium">นายกองค์การนักเรียน</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right 8 cols: Editorial Message */}
            <div className="md:col-span-8 space-y-4">
              <SectionEyebrow number="06" enText="MESSAGE FROM THE PRESIDENT" thText="สารจากนายกองค์การนักเรียน" />
              <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold leading-snug">
                {presidentHeadline}
              </h2>
              <p className="text-sm md:text-base text-[#1B1226]/80 leading-relaxed font-sans whitespace-pre-line">
                {presidentMessage?.trim() ||
                  president?.quote ||
                  "องค์การนักเรียนยินดีต้อนรับนักเรียน ครู อาจารย์ และผู้ปกครองทุกท่าน เว็บไซต์นี้จัดทำขึ้นเพื่อเป็นช่องทางหลักในการสื่อสารความเคลื่อนไหว ประกาศระเบียบ กิจกรรม และที่สำคัญที่สุดคือเป็นช่องทางรับฟังความคิดเห็นและข้อเสนอแนะเพื่อร่วมสร้างสรรค์สังคมโรงเรียนของเราให้น่าอยู่และเปี่ยมด้วยคุณภาพ"}
              </p>
              <div className="pt-2 border-t border-[#4B1F7A]/10">
                <div className="font-serif text-base font-semibold text-[#4B1F7A]">
                  {president?.name || 'นายกองค์การนักเรียน'}
                </div>
                <div className="text-xs text-[#9C7A2B]">
                  {president?.position || 'นายกองค์การนักเรียน'} โรงเรียนสาธิตมหาวิทยาลัยพะเยา {president?.yearTH ? `ปีการศึกษา ${president.yearTH}` : `ปีการศึกษา ${academicYearTH}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
