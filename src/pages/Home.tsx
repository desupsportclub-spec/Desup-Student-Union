/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  getCachedBannersSync,
  getCachedEventsSync,
  getCachedNewsSync,
  getCachedPeopleSync,
  loadActiveBanners,
  loadPeopleList,
  loadPublishedEvents,
  loadPublishedNews,
} from '../lib/publicDataService';
import { NewsItem, EventItem, PersonItem, BannerItem, ComplaintItem } from '../types';
import {
  formatThaiDate,
  getThaiDateParts,
  formatNumber,
  isEventActiveOrUpcoming,
  getEventScheduleStatus,
  getEventDateKey,
} from '../lib/format';
import { SectionEyebrow, CornerBracket, PinIcon } from '../components/common/Ornament';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { Emblem } from '../components/common/Emblem';
import { HeroBannerSlider } from '../components/home/HeroBannerSlider';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { computeComplaintStats, syncComplaintStatsToSettings } from '../lib/complaintStatsSync';
import {
  getNewsCoverUrl,
  getNewsYouTubeUrl,
  YouTubeLitePlayer,
} from '../components/news/SocialMediaEmbed';

function splitHomeNews(newsList: NewsItem[]) {
  if (newsList.length === 0) {
    return { featured: null, recent: [], pinnedList: [], photos: [] };
  }

  const pinnedList = newsList.filter((n) => n.pinned);
  const unpinned = newsList.filter((n) => !n.pinned);
  // Keep latest non-pinned post(s) in top area when available; otherwise fall back to full list
  const topPool = unpinned.length > 0 ? unpinned : newsList;
  const featured = topPool[0] || null;
  const recent = featured ? topPool.filter((n) => n.id !== featured.id).slice(0, 4) : [];

  const photos: { src: string; title: string }[] = [];
  newsList
    .filter((n) => n.category === 'activity')
    .slice(0, 6)
    .forEach((item) => {
      const src = getNewsCoverUrl(item);
      if (src) {
        photos.push({ src, title: item.title });
      }
    });

  return { featured, recent, pinnedList, photos };
}

function resolvePresident(peopleList: PersonItem[]): PersonItem | null {
  const candidates = peopleList.filter((p) => {
    const pos = (p.position || '').trim();
    const isVice = pos.includes('อุปนายก') || pos.includes('รองนายก') || pos.includes('รองประธาน');
    const isPresidentTitle = (pos.includes('นายก') || pos.includes('ประธาน')) && !isVice;
    return p.role === 'president' || isPresidentTitle;
  });
  candidates.sort((a, b) => {
    const yrDiff = (b.yearTH || '').localeCompare(a.yearTH || '');
    if (yrDiff !== 0) return yrDiff;
    const timeA = a.updatedAt || a.createdAt || '';
    const timeB = b.updatedAt || b.createdAt || '';
    if (timeB !== timeA) return timeB.localeCompare(timeA);
    return (a.order || 999) - (b.order || 999);
  });
  return candidates.length > 0 ? candidates[0] : null;
}

export const Home: React.FC = () => {
  const { academicYearTH, presidentHeadline, presidentMessage, complaintStats } = useSiteSettings();

  const initialNews = getCachedNewsSync();
  const initialNewsSplit = initialNews ? splitHomeNews(initialNews) : null;
  const initialEvents = getCachedEventsSync();
  const initialPeople = getCachedPeopleSync();

  const [banners, setBanners] = useState<BannerItem[]>(() => getCachedBannersSync() || []);
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(() => initialNewsSplit?.featured || null);
  const [recentNews, setRecentNews] = useState<NewsItem[]>(() => initialNewsSplit?.recent || []);
  const [pinnedNews, setPinnedNews] = useState<NewsItem[]>(() => initialNewsSplit?.pinnedList || []);
  const [newsLoading, setNewsLoading] = useState<boolean>(() => !initialNews);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>(() =>
    initialEvents ? initialEvents.filter((e) => isEventActiveOrUpcoming(e)).slice(0, 6) : []
  );
  const [president, setPresident] = useState<PersonItem | null>(() => (initialPeople ? resolvePresident(initialPeople) : null));
  const [galleryPhotos, setGalleryPhotos] = useState<{ src: string; title: string }[]>(() => initialNewsSplit?.photos || []);

  // Optional direct admin override when admin visits homepage
  const [adminComplaintStats, setAdminComplaintStats] = useState<{
    total: number;
    inProgress: number;
    resolved: number;
  } | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Embla Carousel for upcoming events
  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true });

  const applyNewsList = useCallback((newsList: NewsItem[]) => {
    const { featured, recent, pinnedList, photos } = splitHomeNews(newsList);
    setFeaturedNews(featured);
    setRecentNews(recent);
    setPinnedNews(pinnedList);
    setGalleryPhotos(photos);
    setNewsLoading(false);
  }, []);

  // Load live data from Firestore in parallel with cache-first hydration
  useEffect(() => {
    let active = true;

    const loadBannersTask = loadActiveBanners((list) => {
      if (active) setBanners(list);
    });

    const loadNewsTask = loadPublishedNews((list) => {
      if (active) applyNewsList(list);
    }).finally(() => {
      if (active) setNewsLoading(false);
    });

    const loadEventsTask = loadPublishedEvents((list) => {
      if (!active) return;
      setUpcomingEvents(list.filter((e) => isEventActiveOrUpcoming(e)).slice(0, 6));
    });

    const loadPeopleTask = loadPeopleList((list) => {
      if (!active) return;
      setPresident(resolvePresident(list));
    });

    // If an admin is signed in, reconcile exact complaint counts and sync back to public settings/site
    const loadComplaintsTask = auth.currentUser
      ? getDocs(collection(db, 'complaints'))
          .then((complaintsSnap) => {
            if (!active) return;
            const list: Pick<ComplaintItem, 'status'>[] = [];
            complaintsSnap.forEach((d) => {
              const status = d.data().status;
              if (status) list.push({ status });
            });
            const computed = computeComplaintStats(list);
            setAdminComplaintStats(computed);
            void syncComplaintStatsToSettings(computed);
          })
          .catch(() => {})
      : Promise.resolve();

    Promise.allSettled([
      loadBannersTask,
      loadNewsTask,
      loadEventsTask,
      loadPeopleTask,
      loadComplaintsTask,
    ]);

    return () => {
      active = false;
    };
  }, [applyNewsList]);

  return (
    <div className={`space-y-12 sm:space-y-16 md:space-y-24 ${banners.length === 0 ? 'pt-8 sm:pt-10' : ''}`}>
      {/* ========================================================
          00. HERO BANNER SLIDER (Full Width Prominent Carousel)
         ======================================================== */}
      <HeroBannerSlider banners={banners} />

      {/* ========================================================
          00.5 ปักหมุดหน้าแรก (แสดงด้านบนข่าวสารและความเคลื่อนไหว)
         ======================================================== */}
      {pinnedNews.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6 pb-3 border-b border-[#B8923A]/30">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-semibold text-[#9C7A2B]">
              <PinIcon className="w-3.5 h-3.5 text-[#9C7A2B]" />
              <span>PINNED HIGHLIGHTS</span>
            </div>
            <span className="text-xs text-[#1B1226]/60">
              ปักหมุดทั้งหมด {pinnedNews.length} รายการ
            </span>
          </div>

          {pinnedNews.length === 1 ? (
            (() => {
              const item = pinnedNews[0];
              const ytUrl = getNewsYouTubeUrl(item);
              const coverUrl = getNewsCoverUrl(item);
              return (
                <div className="relative border border-[#B8923A]/45 bg-[#FAF7F0] p-4 sm:p-6 rounded-sm shadow-editorial">
                  <CornerBracket position="top-left" />
                  <CornerBracket position="top-right" />
                  <CornerBracket position="bottom-left" />
                  <CornerBracket position="bottom-right" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
                    <div className="lg:col-span-7">
                      {ytUrl ? (
                        <YouTubeLitePlayer url={ytUrl} title={item.title} />
                      ) : coverUrl ? (
                        <Link to={`/news/read/${item.id}`} className="block aspect-[16/9] bg-stone-100 rounded-sm overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={item.title}
                            loading="eager"
                            decoding="async"
                            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
                          />
                        </Link>
                      ) : (
                        <Link to={`/news/read/${item.id}`} className="aspect-[16/9] bg-[#EDE6F5] rounded-sm flex items-center justify-center text-[#4B1F7A]">
                          <Emblem size={56} />
                        </Link>
                      )}
                    </div>

                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1B1226]/65">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#4B1F7A] text-[#FAF7F0] text-[10px] font-medium">
                          <PinIcon className="w-3 h-3 text-[#D9B867]" />
                          <span>ปักหมุด</span>
                        </span>
                        <NewsCategoryBadge category={item.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatThaiDate(item.createdAt, true)}</span>
                      </div>

                      <Link to={`/news/read/${item.id}`} className="block group">
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </Link>

                      {item.excerpt && (
                        <p className="text-xs sm:text-sm text-[#1B1226]/75 line-clamp-3 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#4B1F7A]/10">
                        <span className="text-xs text-[#1B1226]/55">
                          อ่าน {formatNumber(item.views)} ครั้ง
                        </span>
                        <Link
                          to={`/news/read/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B1F7A] text-[#FAF7F0] hover:bg-[#2A1245] text-xs font-medium rounded-sm transition-colors"
                        >
                          <span>เปิดอ่านรายละเอียด</span>
                          <span className="text-[#D9B867]">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div
              className={`grid grid-cols-1 gap-5 sm:gap-6 ${
                pinnedNews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {pinnedNews.map((item) => {
                const ytUrl = getNewsYouTubeUrl(item);
                const coverUrl = getNewsCoverUrl(item);
                return (
                  <div
                    key={item.id}
                    className="relative border border-[#B8923A]/45 bg-[#FAF7F0] p-4 sm:p-5 rounded-sm shadow-editorial flex flex-col justify-between space-y-4"
                  >
                    <CornerBracket position="top-left" />
                    <CornerBracket position="top-right" />
                    <CornerBracket position="bottom-left" />
                    <CornerBracket position="bottom-right" />

                    <div className="space-y-3">
                      {ytUrl ? (
                        <YouTubeLitePlayer url={ytUrl} title={item.title} />
                      ) : coverUrl ? (
                        <Link to={`/news/read/${item.id}`} className="block aspect-[16/9] bg-stone-100 rounded-sm overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
                          />
                        </Link>
                      ) : (
                        <Link to={`/news/read/${item.id}`} className="aspect-[16/9] bg-[#EDE6F5] rounded-sm flex items-center justify-center text-[#4B1F7A]">
                          <Emblem size={44} />
                        </Link>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#1B1226]/65">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#4B1F7A] text-[#FAF7F0] text-[10px] font-medium">
                          <PinIcon className="w-3 h-3 text-[#D9B867]" />
                          <span>ปักหมุด</span>
                        </span>
                        <NewsCategoryBadge category={item.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatThaiDate(item.createdAt, true)}</span>
                      </div>

                      <Link to={`/news/read/${item.id}`} className="block group">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </Link>

                      {item.excerpt && (
                        <p className="text-xs text-[#1B1226]/70 line-clamp-2 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#4B1F7A]/10 flex items-center justify-between text-xs">
                      <span className="text-[#1B1226]/55">อ่าน {formatNumber(item.views)} ครั้ง</span>
                      <Link
                        to={`/news/read/${item.id}`}
                        className="text-[#4B1F7A] font-medium hover:text-[#9C7A2B] transition-colors"
                      >
                        เปิดอ่านรายละเอียด →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          01. ข่าวเด่น & ข่าวรอง (Lead story left + 4 vertical items right)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-[#B8923A]/30">
          <div>
            <SectionEyebrow number="01" enText="NEWS" thText="ข่าวประชาสัมพันธ์" />
            <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
              ข่าวสารและความเคลื่อนไหว
            </h2>
          </div>
          <Link to="/news" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-3 md:mt-0 self-start md:self-auto">
            <span>ข่าวทั้งหมด</span>
            <span className="text-[#B8923A]">→</span>
          </Link>
        </div>

        {newsLoading && !featuredNews ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
            <div className="lg:col-span-7 border border-[#4B1F7A]/10 bg-[#FAF7F0] p-4 sm:p-6 rounded-sm space-y-4">
              <div className="aspect-[16/9] bg-stone-200 rounded-sm" />
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 bg-stone-200 rounded w-4/5" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-3.5 border border-[#4B1F7A]/10 bg-[#FAF7F0] rounded-sm">
                  <div className="w-20 h-16 sm:w-24 sm:h-20 bg-stone-200 rounded-sm shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : featuredNews ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left 7 cols: Large Featured Card */}
            <div className="lg:col-span-7">
              <Link
                to={`/news/read/${featuredNews.id}`}
                className="group block relative border border-[#4B1F7A]/15 bg-[#FAF7F0] p-4 sm:p-6 rounded-sm shadow-editorial transition-all duration-300 hover:border-[#B8923A]/70"
              >
                <CornerBracket position="top-left" />
                <CornerBracket position="top-right" />
                <CornerBracket position="bottom-left" />
                <CornerBracket position="bottom-right" />

                <div className="aspect-[16/9] bg-stone-100 overflow-hidden mb-4 sm:mb-5 rounded-sm relative">
                  {getNewsCoverUrl(featuredNews) ? (
                    <img
                      src={getNewsCoverUrl(featuredNews) || ''}
                      alt={featuredNews.title}
                      decoding="async"
                      fetchPriority="high"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center text-[#4B1F7A]">
                      <Emblem size={64} />
                    </div>
                  )}

                  {(featuredNews.category === 'video' || getNewsYouTubeUrl(featuredNews)) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#B8923A] text-white flex items-center justify-center shadow-lg">
                        ▶
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#1B1226]/60">
                    <NewsCategoryBadge category={featuredNews.category} />
                    <span aria-hidden="true">·</span>
                    <span>{formatThaiDate(featuredNews.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>อ่าน {formatNumber(featuredNews.views)} ครั้ง</span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2">
                    {featuredNews.title}
                  </h3>

                  <p className="text-xs md:text-sm text-[#1B1226]/70 line-clamp-2 leading-relaxed">
                    {featuredNews.excerpt || 'คลิกเพื่ออ่านรายละเอียดเนื้อหาข่าวสารฉบับเต็ม'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right 5 cols: 4 Vertical Secondary List Items */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4">
              {recentNews.length > 0 ? (
                recentNews.map((item) => {
                  const thumb = getNewsCoverUrl(item);
                  const hasVideo = item.category === 'video' || Boolean(getNewsYouTubeUrl(item));
                  return (
                    <Link
                      key={item.id}
                      to={`/news/read/${item.id}`}
                      className="group flex gap-3 sm:gap-4 p-3 sm:p-3.5 border border-[#4B1F7A]/10 hover:border-[#B8923A]/50 bg-[#FAF7F0] rounded-sm transition-all duration-300"
                    >
                      <div className="w-20 h-16 sm:w-24 sm:h-20 bg-stone-100 rounded-sm shrink-0 overflow-hidden relative">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center text-[#4B1F7A]/50">
                            <Emblem size={28} />
                          </div>
                        )}
                        {hasVideo && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-[#B8923A] text-white text-[10px] flex items-center justify-center">
                              ▶
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#1B1226]/60">
                          <NewsCategoryBadge category={item.category} />
                          <span aria-hidden="true">·</span>
                          <span>{formatThaiDate(item.createdAt, true)}</span>
                        </div>
                        <h4 className="font-serif text-sm font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  );
                })
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
          02. รายงานผลการดำเนินงาน (Dark violet-900 section)
         ======================================================== */}
      {(() => {
        const displayStats = adminComplaintStats || complaintStats;
        return (
          <section className="bg-[#2A1245] text-[#FAF7F0] py-14 sm:py-20 relative overflow-hidden border-y border-[#B8923A]/30">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 relative z-10">
              <div className="mb-8 sm:mb-12 text-center max-w-xl mx-auto space-y-2">
                <SectionEyebrow number="02" enText="PERFORMANCE REPORT" thText="รายงานผลการดำเนินงาน" light />
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#FAF7F0]">
                  เปิดเผย โปร่งใส มุ่งมั่นเพื่อนักเรียน
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12 text-center max-w-4xl mx-auto">
                {/* Stat 1: Total Complaints */}
                <div className="space-y-1.5 sm:space-y-2 border-b sm:border-b-0 sm:border-r border-[#B8923A]/20 pb-5 sm:pb-0 sm:pr-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#D9B867] tabular-numbers font-medium">
                    {formatNumber(displayStats.total)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-[#FAF7F0]/80 uppercase">
                    เรื่องร้องเรียนทั้งหมด
                  </div>
                </div>

                {/* Stat 2: In Progress Complaints */}
                <div className="space-y-1.5 sm:space-y-2 border-b sm:border-b-0 sm:border-r border-[#B8923A]/20 pb-5 sm:pb-0 sm:px-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FAF7F0] tabular-numbers font-medium">
                    {formatNumber(displayStats.inProgress)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-[#FAF7F0]/80 uppercase">
                    กำลังดำเนินการ
                  </div>
                </div>

                {/* Stat 3: Resolved Complaints (Case count, no %) */}
                <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-0 sm:pl-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#D9B867] tabular-numbers font-medium">
                    {formatNumber(displayStats.resolved)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-[#FAF7F0]/80 uppercase">
                    ดำเนินการเสร็จสิ้น
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ========================================================
          03. กิจกรรมที่กำลังจะมาถึง (Upcoming Events carousel)
         ======================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-[#B8923A]/30">
          <div>
            <SectionEyebrow number="03" enText="SCHEDULE" thText="ปฏิทินกิจกรรม" />
            <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
              กิจกรรมที่กำลังจะมาถึง
            </h2>
          </div>
          <Link to="/calendar" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-3 md:mt-0 self-start md:self-auto">
            <span>ดูปฏิทินทั้งหมด</span>
            <span className="text-[#B8923A]">→</span>
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-6">
              {upcomingEvents.map((evt) => {
                const dateParts = getThaiDateParts(evt.startAt);
                const scheduleStatus = getEventScheduleStatus(evt.startAt, evt.endAt);
                const startKey = getEventDateKey(evt.startAt);
                const endKey = getEventDateKey(evt.endAt);
                const hasDateRange = Boolean(evt.endAt && endKey > startKey);
                return (
                  <div
                    key={evt.id}
                    className="flex-[0_0_86%] sm:flex-[0_0_46%] lg:flex-[0_0_32%] min-w-0 border border-[#4B1F7A]/15 bg-[#FAF7F0] p-5 sm:p-6 rounded-sm shadow-editorial flex flex-col justify-between"
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
                        <div className="min-w-0 flex-1">
                          {scheduleStatus === 'ongoing' && (
                            <div className="mb-1">
                              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium">
                                อยู่ในช่วงจัดกิจกรรม
                              </span>
                            </div>
                          )}
                          <h3 className="font-serif text-lg font-semibold text-[#1B1226] line-clamp-2">
                            {evt.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-[#1B1226]/70 line-clamp-2 mb-4 leading-relaxed">
                        {evt.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#4B1F7A]/10 text-xs text-[#1B1226]/60 flex items-center justify-between gap-2">
                      <span className="truncate">📍 {evt.location || 'โรงเรียนสาธิต มพ.'}</span>
                      <span className="text-[#9C7A2B] shrink-0">
                        {hasDateRange && evt.endAt
                          ? `ถึง ${formatThaiDate(evt.endAt, true)}`
                          : `พ.ศ. ${dateParts.yearBE}`}
                      </span>
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
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="mb-6 sm:mb-10 pb-4 border-b border-[#B8923A]/30">
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
              className="group py-4 sm:py-5 px-2 sm:px-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-[#EDE6F5]/50 transition-colors duration-200"
            >
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-6 min-w-0">
                <span className="font-serif text-base sm:text-lg text-[#9C7A2B] font-medium w-6 sm:w-8 shrink-0">
                  {item.num}
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif text-base md:text-lg font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#1B1226]/60 mt-0.5 max-w-2xl">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-[#9C7A2B] group-hover:translate-x-2 transition-transform duration-200 font-serif shrink-0">
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
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-[#B8923A]/30">
            <div>
              <SectionEyebrow number="05" enText="GALLERY" thText="ภาพข่าวกิจกรรม" />
              <h2 className="font-serif text-2xl md:text-3xl text-[#1B1226] font-semibold mt-2">
                ประมวลภาพบรรยากาศ
              </h2>
            </div>
            <Link to="/news/activity" className="btn-secondary-link text-xs font-medium text-[#4B1F7A] mt-3 md:mt-0 self-start md:self-auto">
              <span>ภาพกิจกรรมทั้งหมด</span>
              <span className="text-[#B8923A]">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#2A1245]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4 text-white text-xs">
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
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 pb-8 sm:pb-12">
        <div className="bg-[#FAF7F0] border border-[#B8923A]/40 p-5 sm:p-8 md:p-14 rounded-sm shadow-editorial relative overflow-hidden">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left 4 cols: President photo with greyscale-to-color transition */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-36 h-44 sm:w-48 sm:h-60 md:w-56 md:h-72 border border-[#B8923A] rounded-sm overflow-hidden shadow-editorial bg-stone-100">
                {president?.photo?.url || president?.photoUrl ? (
                  <img
                    src={president.photo?.url || president.photoUrl}
                    alt={president.name}
                    loading="lazy"
                    decoding="async"
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
            <div className="md:col-span-8 space-y-3 sm:space-y-4">
              <SectionEyebrow number="06" enText="MESSAGE FROM THE PRESIDENT" thText="สารจากนายกองค์การนักเรียน" />
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1B1226] font-semibold leading-snug">
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
