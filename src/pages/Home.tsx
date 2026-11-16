/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  formatAcademicYear,
  formatDate,
  getDateParts,
  formatNumber,
  isEventActiveOrUpcoming,
  getEventScheduleStatus,
  getEventDateKey,
} from '../lib/format';
import { SectionEyebrow, CornerBracket, PinIcon } from '../components/common/Ornament';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { Emblem } from '../components/common/Emblem';
import { HeroBannerSlider } from '../components/home/HeroBannerSlider';
import { LocLink } from '../components/common/LocLink';
import { SeoHead } from '../components/common/SeoHead';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { computeComplaintStats, syncComplaintStatsToSettings } from '../lib/complaintStatsSync';
import { pickL10n } from '../lib/l10n';
import { FallbackLangBadge } from '../components/common/FallbackLangBadge';
import {
  getNewsCoverUrl,
  getNewsYouTubeUrl,
  YouTubeLitePlayer,
} from '../components/news/SocialMediaEmbed';

const THAI_DEFAULT_HEADLINE = '"พวกเราพร้อมเป็นตัวแทนและรับฟังทุกเสียงของเพื่อนนักเรียนสาธิต มพ."';

function splitHomeNews(newsList: NewsItem[]) {
  if (newsList.length === 0) {
    return { featured: null, recent: [], pinnedList: [], photos: [] };
  }

  const pinnedList = newsList.filter((n) => n.pinned);
  const unpinned = newsList.filter((n) => !n.pinned);
  const topPool = unpinned.length > 0 ? unpinned : newsList;
  const featured = topPool[0] || null;
  const recent = featured ? topPool.filter((n) => n.id !== featured.id).slice(0, 4) : [];

  const photos: { src: string; title: string; titleEn?: string }[] = [];
  newsList
    .filter((n) => n.category === 'activity')
    .slice(0, 6)
    .forEach((item) => {
      const src = getNewsCoverUrl(item);
      if (src) {
        photos.push({ src, title: item.title, titleEn: item.titleEn });
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
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const {
    academicYearTH,
    presidentHeadline,
    presidentHeadlineEn,
    presidentMessage,
    presidentMessageEn,
    complaintStats,
  } = useSiteSettings();

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
  const [galleryPhotos, setGalleryPhotos] = useState<{ src: string; title: string; titleEn?: string }[]>(
    () => initialNewsSplit?.photos || []
  );

  const [adminComplaintStats, setAdminComplaintStats] = useState<{
    total: number;
    inProgress: number;
    resolved: number;
  } | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true });

  const applyNewsList = useCallback((newsList: NewsItem[]) => {
    const { featured, recent, pinnedList, photos } = splitHomeNews(newsList);
    setFeaturedNews(featured);
    setRecentNews(recent);
    setPinnedNews(pinnedList);
    setGalleryPhotos(photos);
    setNewsLoading(false);
  }, []);

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

  // เลือกคำกล่าวหัวข้อ สาร และชื่อนายกองค์การตามภาษาปัจจุบัน พร้อมคำแปลเริ่มต้นกรณีข้อความยังเป็นค่าตั้งต้น
  const headlineRes =
    lang === 'en' && presidentHeadline === THAI_DEFAULT_HEADLINE && !presidentHeadlineEn.trim()
      ? {
          text: '"We are ready to represent and listen to every voice of DeSUP students."',
          isFallback: false,
        }
      : pickL10n(presidentHeadline, presidentHeadlineEn, lang);

  const rawPresidentMsgTh = presidentMessage?.trim() || president?.quote?.trim() || '';
  const rawPresidentMsgEn = presidentMessageEn?.trim() || president?.quoteEn?.trim() || '';
  const presidentMsgRes = pickL10n(rawPresidentMsgTh, rawPresidentMsgEn, lang);
  const presidentNameRes = pickL10n(president?.name, president?.nameEn, lang);
  const displayPresidentYear = formatAcademicYear(president?.yearTH || academicYearTH, lang);

  return (
    <div className={`space-y-12 sm:space-y-16 md:space-y-24 ${banners.length === 0 ? 'pt-8 sm:pt-10' : ''}`}>
      <SeoHead
        titleKey="seo.pages.home.title"
        descriptionKey="seo.pages.home.desc"
        appendSiteName={false}
      />

      {/* 00. แถบสไลด์แบนเนอร์ประชาสัมพันธ์ */}
      <HeroBannerSlider banners={banners} />

      {/* 00.5 ข่าวปักหมุดหน้าแรก */}
      {pinnedNews.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6 pb-3 border-b border-gold-border/30">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-semibold text-gold-text">
              <PinIcon className="w-3.5 h-3.5 text-gold-text" />
              <span>{t('home.pinnedEyebrow')}</span>
            </div>
            <span className="text-xs text-text-muted">
              {t('home.pinnedTotal', { count: pinnedNews.length })}
            </span>
          </div>

          {pinnedNews.length === 1 ? (
            (() => {
              const item = pinnedNews[0];
              const ytUrl = getNewsYouTubeUrl(item);
              const coverUrl = getNewsCoverUrl(item);
              const titleRes = pickL10n(item.title, item.titleEn, lang);
              const excerptRes = pickL10n(item.excerpt, item.excerptEn, lang);
              return (
                <div className="relative border border-gold-border/45 bg-surface p-4 sm:p-6 rounded-sm shadow-editorial">
                  <CornerBracket position="top-left" />
                  <CornerBracket position="top-right" />
                  <CornerBracket position="bottom-left" />
                  <CornerBracket position="bottom-right" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
                    <div className="lg:col-span-7">
                      {ytUrl ? (
                        <YouTubeLitePlayer url={ytUrl} title={titleRes.text} />
                      ) : coverUrl ? (
                        <LocLink to={`/news/read/${item.id}`} className="block aspect-[16/9] bg-bg-alt rounded-sm overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={titleRes.text}
                            loading="eager"
                            decoding="async"
                            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
                          />
                        </LocLink>
                      ) : (
                        <LocLink to={`/news/read/${item.id}`} className="aspect-[16/9] bg-brand-soft rounded-sm flex items-center justify-center text-accent">
                          <Emblem size={56} />
                        </LocLink>
                      )}
                    </div>

                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand text-brand-contrast text-[10px] font-medium">
                          <PinIcon className="w-3 h-3 text-gold-light" />
                          <span>{t('home.pinnedTag')}</span>
                        </span>
                        <NewsCategoryBadge category={item.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(item.createdAt, lang, true)}</span>
                        <FallbackLangBadge show={titleRes.isFallback} />
                      </div>

                      <LocLink to={`/news/read/${item.id}`} className="block group">
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-heading group-hover:text-accent transition-colors leading-snug">
                          {titleRes.text}
                        </h3>
                      </LocLink>

                      {excerptRes.text && (
                        <p className="text-xs sm:text-sm text-text-muted line-clamp-3 leading-relaxed">
                          {excerptRes.text}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gold-border/15">
                        <span className="text-xs text-text-muted">
                          {t('site.viewsCount', { count: formatNumber(item.views, lang) })}
                        </span>
                        <LocLink
                          to={`/news/read/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-contrast hover:bg-brand-hover text-xs font-medium rounded-sm transition-colors"
                        >
                          <span>{t('site.openDetails')}</span>
                          <span className="text-gold-light">→</span>
                        </LocLink>
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
                const titleRes = pickL10n(item.title, item.titleEn, lang);
                const excerptRes = pickL10n(item.excerpt, item.excerptEn, lang);
                return (
                  <div
                    key={item.id}
                    className="relative border border-gold-border/45 bg-surface p-4 sm:p-5 rounded-sm shadow-editorial flex flex-col justify-between space-y-4"
                  >
                    <CornerBracket position="top-left" />
                    <CornerBracket position="top-right" />
                    <CornerBracket position="bottom-left" />
                    <CornerBracket position="bottom-right" />

                    <div className="space-y-3">
                      {ytUrl ? (
                        <YouTubeLitePlayer url={ytUrl} title={titleRes.text} />
                      ) : coverUrl ? (
                        <LocLink to={`/news/read/${item.id}`} className="block aspect-[16/9] bg-bg-alt rounded-sm overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={titleRes.text}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
                          />
                        </LocLink>
                      ) : (
                        <LocLink to={`/news/read/${item.id}`} className="aspect-[16/9] bg-brand-soft rounded-sm flex items-center justify-center text-accent">
                          <Emblem size={44} />
                        </LocLink>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand text-brand-contrast text-[10px] font-medium">
                          <PinIcon className="w-3 h-3 text-gold-light" />
                          <span>{t('home.pinnedTag')}</span>
                        </span>
                        <NewsCategoryBadge category={item.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(item.createdAt, lang, true)}</span>
                        <FallbackLangBadge show={titleRes.isFallback} />
                      </div>

                      <LocLink to={`/news/read/${item.id}`} className="block group">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-heading group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                          {titleRes.text}
                        </h3>
                      </LocLink>

                      {excerptRes.text && (
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                          {excerptRes.text}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gold-border/15 flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        {t('site.viewsCount', { count: formatNumber(item.views, lang) })}
                      </span>
                      <LocLink
                        to={`/news/read/${item.id}`}
                        className="text-accent font-medium hover:text-gold-text transition-colors"
                      >
                        {t('site.openDetails')} →
                      </LocLink>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 01. ข่าวสารและประชาสัมพันธ์ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-gold-border/30">
          <div>
            <SectionEyebrow number="01" enText={t('home.newsEyebrowEn')} thText={t('home.newsEyebrowTh')} />
            <h2 className="font-serif text-2xl md:text-3xl text-heading font-semibold mt-2">
              {t('home.newsHeading')}
            </h2>
          </div>
          <LocLink to="/news" className="btn-secondary-link text-xs font-medium text-accent mt-3 md:mt-0 self-start md:self-auto">
            <span>{t('home.viewAllNews')}</span>
            <span className="text-gold-text">→</span>
          </LocLink>
        </div>

        {newsLoading && !featuredNews ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
            <div className="lg:col-span-7 border border-gold-border/15 bg-surface p-4 sm:p-6 rounded-sm space-y-4">
              <div className="aspect-[16/9] bg-bg-alt rounded-sm" />
              <div className="h-4 bg-bg-alt rounded w-1/3" />
              <div className="h-6 bg-bg-alt rounded w-4/5" />
              <div className="h-4 bg-bg-alt rounded w-2/3" />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-3.5 border border-gold-border/15 bg-surface rounded-sm">
                  <div className="w-20 h-16 sm:w-24 sm:h-20 bg-bg-alt rounded-sm shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-bg-alt rounded w-1/2" />
                    <div className="h-4 bg-bg-alt rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : featuredNews ? (
          (() => {
            const featuredTitleRes = pickL10n(featuredNews.title, featuredNews.titleEn, lang);
            const featuredExcerptRes = pickL10n(featuredNews.excerpt, featuredNews.excerptEn, lang);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                <div className="lg:col-span-7">
                  <LocLink
                    to={`/news/read/${featuredNews.id}`}
                    className="group block relative border border-gold-border/20 bg-surface p-4 sm:p-6 rounded-sm shadow-editorial transition-all duration-300 hover:border-gold"
                  >
                    <CornerBracket position="top-left" />
                    <CornerBracket position="top-right" />
                    <CornerBracket position="bottom-left" />
                    <CornerBracket position="bottom-right" />

                    <div className="aspect-[16/9] bg-bg-alt overflow-hidden mb-4 sm:mb-5 rounded-sm relative">
                      {getNewsCoverUrl(featuredNews) ? (
                        <img
                          src={getNewsCoverUrl(featuredNews) || ''}
                          alt={featuredTitleRes.text}
                          decoding="async"
                          fetchPriority="high"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-soft flex items-center justify-center text-accent">
                          <Emblem size={64} />
                        </div>
                      )}

                      {(featuredNews.category === 'video' || getNewsYouTubeUrl(featuredNews)) && (
                        <div className="absolute inset-0 bg-anchor-bg-deep/25 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-gold text-anchor-bg-deep flex items-center justify-center shadow-lg">
                            ▶
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                        <NewsCategoryBadge category={featuredNews.category} />
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(featuredNews.createdAt, lang)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t('site.viewsCount', { count: formatNumber(featuredNews.views, lang) })}</span>
                        <FallbackLangBadge show={featuredTitleRes.isFallback} />
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-heading group-hover:text-accent transition-colors line-clamp-2">
                        {featuredTitleRes.text}
                      </h3>

                      <p className="text-xs md:text-sm text-text-muted line-clamp-2 leading-relaxed">
                        {featuredExcerptRes.text || t('home.defaultExcerpt')}
                      </p>
                    </div>
                  </LocLink>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4">
                  {recentNews.length > 0 ? (
                    recentNews.map((item) => {
                      const thumb = getNewsCoverUrl(item);
                      const hasVideo = item.category === 'video' || Boolean(getNewsYouTubeUrl(item));
                      const itemTitleRes = pickL10n(item.title, item.titleEn, lang);
                      return (
                        <LocLink
                          key={item.id}
                          to={`/news/read/${item.id}`}
                          className="group flex gap-3 sm:gap-4 p-3 sm:p-3.5 border border-gold-border/15 hover:border-gold bg-surface rounded-sm transition-all duration-300"
                        >
                          <div className="w-20 h-16 sm:w-24 sm:h-20 bg-bg-alt rounded-sm shrink-0 overflow-hidden relative">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={itemTitleRes.text}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-soft flex items-center justify-center text-accent/60">
                                <Emblem size={28} />
                              </div>
                            )}
                            {hasVideo && (
                              <div className="absolute inset-0 bg-anchor-bg-deep/30 flex items-center justify-center">
                                <span className="w-6 h-6 rounded-full bg-gold text-anchor-bg-deep text-[10px] flex items-center justify-center">
                                  ▶
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted">
                              <NewsCategoryBadge category={item.category} />
                              <span aria-hidden="true">·</span>
                              <span>{formatDate(item.createdAt, lang, true)}</span>
                              <FallbackLangBadge show={itemTitleRes.isFallback} />
                            </div>
                            <h4 className="font-serif text-sm font-semibold text-heading group-hover:text-accent transition-colors line-clamp-2">
                              {itemTitleRes.text}
                            </h4>
                          </div>
                        </LocLink>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center border border-dashed border-gold-border/25 rounded-sm text-xs text-text-muted">
                      {t('home.waitingMoreNews')}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="p-12 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/50">
            <p className="font-serif text-lg text-heading mb-2">{t('home.noNewsTitle')}</p>
            <p className="text-xs text-text-muted">{t('home.noNewsDesc')}</p>
          </div>
        )}
      </section>

      {/* 02. รายงานผลการดำเนินงาน */}
      {(() => {
        const displayStats = adminComplaintStats || complaintStats;
        return (
          <section className="bg-anchor-bg text-anchor-text py-14 sm:py-20 relative overflow-hidden border-y border-gold/30">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 relative z-10">
              <div className="mb-8 sm:mb-12 text-center max-w-xl mx-auto space-y-2">
                <SectionEyebrow number="02" enText={t('home.reportEyebrowEn')} thText={t('home.reportEyebrowTh')} light />
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-anchor-text">
                  {lang === 'en' ? `"${t('site.motto')}"` : `“${t('site.motto')}”`}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12 text-center max-w-4xl mx-auto">
                <div className="space-y-1.5 sm:space-y-2 border-b sm:border-b-0 sm:border-r border-gold/20 pb-5 sm:pb-0 sm:pr-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-anchor-gold tabular-numbers font-medium">
                    {formatNumber(displayStats.total, lang)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-anchor-text/80 uppercase">
                    {t('home.statTotal')}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 border-b sm:border-b-0 sm:border-r border-gold/20 pb-5 sm:pb-0 sm:px-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-anchor-text tabular-numbers font-medium">
                    {formatNumber(displayStats.inProgress, lang)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-anchor-text/80 uppercase">
                    {t('home.statInProgress')}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-0 sm:pl-4">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-anchor-gold tabular-numbers font-medium">
                    {formatNumber(displayStats.resolved, lang)}
                  </div>
                  <div className="text-[11px] sm:text-xs tracking-wider text-anchor-text/80 uppercase">
                    {t('home.statResolved')}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 03. กิจกรรมที่กำลังจะมาถึง */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-gold-border/30">
          <div>
            <SectionEyebrow number="03" enText={t('home.scheduleEyebrowEn')} thText={t('home.scheduleEyebrowTh')} />
            <h2 className="font-serif text-2xl md:text-3xl text-heading font-semibold mt-2">
              {t('home.scheduleHeading')}
            </h2>
          </div>
          <LocLink to="/calendar" className="btn-secondary-link text-xs font-medium text-accent mt-3 md:mt-0 self-start md:self-auto">
            <span>{t('home.viewAllCalendar')}</span>
            <span className="text-gold-text">→</span>
          </LocLink>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-6">
              {upcomingEvents.map((evt) => {
                const dateParts = getDateParts(evt.startAt, lang);
                const scheduleStatus = getEventScheduleStatus(evt.startAt, evt.endAt);
                const startKey = getEventDateKey(evt.startAt);
                const endKey = getEventDateKey(evt.endAt);
                const hasDateRange = Boolean(evt.endAt && endKey > startKey);
                const titleRes = pickL10n(evt.title, evt.titleEn, lang);
                const descRes = pickL10n(evt.description, evt.descriptionEn, lang);
                const locRes = pickL10n(evt.location, evt.locationEn, lang);
                return (
                  <div
                    key={evt.id}
                    className="flex-[0_0_86%] sm:flex-[0_0_46%] lg:flex-[0_0_32%] min-w-0 border border-gold-border/20 bg-surface p-5 sm:p-6 rounded-sm shadow-editorial flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-brand-soft border border-gold-border/30 p-2 text-center rounded-sm min-w-[56px]">
                          <div className="font-serif text-2xl font-bold text-accent leading-none">
                            {dateParts.day}
                          </div>
                          <div className="text-[11px] text-gold-text font-medium mt-1">
                            {dateParts.monthShort}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          {(scheduleStatus === 'ongoing' || titleRes.isFallback) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {scheduleStatus === 'ongoing' && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-success-bg border border-success/30 text-success text-[10px] font-medium">
                                  {t('home.ongoingBadge')}
                                </span>
                              )}
                              <FallbackLangBadge show={titleRes.isFallback} />
                            </div>
                          )}
                          <h3 className="font-serif text-lg font-semibold text-heading line-clamp-2">
                            {titleRes.text}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">
                        {descRes.text || t('home.noEventDesc')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gold-border/15 text-xs text-text-muted flex items-center justify-between gap-2">
                      <span className="truncate">📍 {locRes.text || t('home.defaultLocation')}</span>
                      <span className="text-gold-text shrink-0">
                        {hasDateRange && evt.endAt
                          ? t('home.untilDate', { date: formatDate(evt.endAt, lang, true) })
                          : t('home.yearBadge', { year: dateParts.yearDisplay })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/50">
            <p className="font-serif text-lg text-heading mb-2">{t('home.noEventsTitle')}</p>
            <p className="text-xs text-text-muted">{t('home.noEventsDesc')}</p>
          </div>
        )}
      </section>

      {/* 04. แกลเลอรีภาพกิจกรรม */}
      {galleryPhotos.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-gold-border/30">
            <div>
              <SectionEyebrow number="04" enText={t('home.galleryEyebrowEn')} thText={t('home.galleryEyebrowTh')} />
              <h2 className="font-serif text-2xl md:text-3xl text-heading font-semibold mt-2">
                {t('home.galleryHeading')}
              </h2>
            </div>
            <LocLink to="/news/activity" className="btn-secondary-link text-xs font-medium text-accent mt-3 md:mt-0 self-start md:self-auto">
              <span>{t('home.viewAllGallery')}</span>
              <span className="text-gold-text">→</span>
            </LocLink>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {galleryPhotos.map((photo, index) => {
              const photoTitle = pickL10n(photo.title, photo.titleEn, lang).text;
              return (
                <div
                  key={index}
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="cursor-pointer group relative overflow-hidden bg-bg-alt border border-gold-border/20 rounded-sm aspect-[4/3]"
                >
                  <img
                    src={photo.src}
                    alt={photoTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-anchor-bg/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-4 text-anchor-text text-xs">
                    <span className="line-clamp-2 font-medium">{photoTitle}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={galleryPhotos.map((p) => ({
              src: p.src,
              title: pickL10n(p.title, p.titleEn, lang).text,
            }))}
          />
        </section>
      )}

      {/* 05. สารจากนายกองค์การนักเรียน */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 pb-8 sm:pb-12">
        <div className="bg-surface border border-gold-border/40 p-5 sm:p-8 md:p-14 rounded-sm shadow-editorial relative overflow-hidden">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-36 h-44 sm:w-48 sm:h-60 md:w-56 md:h-72 border border-gold rounded-sm overflow-hidden shadow-editorial bg-bg-alt">
                {president?.photo?.url || president?.photoUrl ? (
                  <img
                    src={president.photo?.url || president.photoUrl}
                    alt={presidentNameRes.text}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-brand-soft flex flex-col items-center justify-center p-4 text-center">
                    <Emblem size={56} />
                    <span className="text-xs text-accent mt-3 font-medium">{t('home.presidentRoleFallback')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-8 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionEyebrow number="05" enText={t('home.presidentEyebrowEn')} thText={t('home.presidentEyebrowTh')} />
                <FallbackLangBadge show={headlineRes.isFallback || presidentMsgRes.isFallback} />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-heading font-semibold leading-snug">
                {headlineRes.text}
              </h2>
              <p className="text-sm md:text-base text-text/85 leading-relaxed font-sans whitespace-pre-line">
                {presidentMsgRes.text || t('home.defaultPresidentMessage')}
              </p>
              <div className="pt-2 border-t border-gold-border/15">
                <div className="font-serif text-base font-semibold text-accent">
                  {presidentNameRes.text || t('home.presidentRoleFallback')}
                </div>
                <div className="text-xs text-gold-text">
                  {t('home.presidentRoleWithYear', { year: displayPresidentYear })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
