/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  MagnifyingGlass,
  X,
  Newspaper,
  CalendarBlank,
  FileArrowDown,
  Users,
  Compass,
  ArrowRight,
} from '@phosphor-icons/react';
import { NewsItem, EventItem, DownloadItem, PersonItem } from '../../types';
import {
  getCachedNewsSync,
  getCachedEventsSync,
  getCachedDownloadsSync,
  getCachedPeopleSync,
  loadPublishedNews,
  loadPublishedEvents,
  loadDownloads,
  loadPeopleList,
} from '../../lib/publicDataService';
import { useLanguage } from '../../context/LanguageContext';
import { pickL10n } from '../../lib/l10n';
import { formatThaiDate } from '../../lib/format';

interface SiteSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  group: 'page' | 'news' | 'event' | 'download' | 'person';
  title: string;
  subtitle?: string;
  to: string;
  keywords: string;
}

export const SiteSearchModal: React.FC<SiteSearchModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { lang, localize } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [queryText, setQueryText] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [news, setNews] = useState<NewsItem[]>(() => getCachedNewsSync() || []);
  const [events, setEvents] = useState<EventItem[]>(() => getCachedEventsSync() || []);
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => getCachedDownloadsSync() || []);
  const [people, setPeople] = useState<PersonItem[]>(() => getCachedPeopleSync() || []);
  const [loadingData, setLoadingData] = useState(false);

  // โหลดข้อมูลจริงทั้งหมดเมื่อเปิดหน้าต่างค้นหา (ใช้แคชทันทีหากมีอยู่แล้ว)
  useEffect(() => {
    if (!open) return;

    let active = true;
    const hasAllCached =
      Boolean(getCachedNewsSync()) &&
      Boolean(getCachedEventsSync()) &&
      Boolean(getCachedDownloadsSync()) &&
      Boolean(getCachedPeopleSync());

    if (!hasAllCached) setLoadingData(true);

    Promise.allSettled([
      loadPublishedNews((items) => {
        if (active) setNews(items);
      }),
      loadPublishedEvents((items) => {
        if (active) setEvents(items);
      }),
      loadDownloads((items) => {
        if (active) setDownloads(items);
      }),
      loadPeopleList((items) => {
        if (active) setPeople(items);
      }),
    ]).finally(() => {
      if (active) setLoadingData(false);
    });

    return () => {
      active = false;
    };
  }, [open]);

  // โฟกัสช่องค้นหา + ล็อกสโครล + ปิดเมื่อกด Escape
  useEffect(() => {
    if (!open) return;
    setQueryText('');
    setActiveIdx(0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const staticPages: SearchResultItem[] = useMemo(
    () => [
      {
        id: 'page-home',
        group: 'page',
        title: t('nav.home'),
        subtitle: t('site.name'),
        to: '/',
        keywords: 'หน้าหลัก home แรก สธ.มพ desup',
      },
      {
        id: 'page-news',
        group: 'page',
        title: t('nav.news'),
        subtitle: t('nav.newsSub.pr'),
        to: '/news',
        keywords: 'ข่าวสาร ประกาศ กิจกรรม ข้อบังคับ สาระน่ารู้ คลิปวิดีโอ news announcement',
      },
      {
        id: 'page-calendar',
        group: 'page',
        title: t('nav.calendar'),
        subtitle: t('search.pageHints.calendar'),
        to: '/calendar',
        keywords: 'ปฏิทิน กิจกรรม กำหนดการ ตาราง calendar schedule events',
      },
      {
        id: 'page-downloads',
        group: 'page',
        title: t('nav.downloadsFull'),
        subtitle: t('search.pageHints.downloads'),
        to: '/downloads',
        keywords: 'ดาวน์โหลด เอกสาร แบบฟอร์ม ระเบียบ pdf downloads forms',
      },
      {
        id: 'page-board',
        group: 'page',
        title: t('nav.aboutSub.board'),
        subtitle: t('nav.about'),
        to: '/about/board',
        keywords: 'คณะกรรมการ องค์การนักเรียน นายก อุปนายก เลขา board committee',
      },
      {
        id: 'page-advisors',
        group: 'page',
        title: t('nav.aboutSub.advisors'),
        subtitle: t('nav.about'),
        to: '/about/advisors',
        keywords: 'คณะกรรมการที่ปรึกษา อาจารย์ที่ปรึกษา อำนวยการ นักเรียนผู้มีประสบการณ์ advisors',
      },
      {
        id: 'page-hall',
        group: 'page',
        title: t('nav.aboutSub.hall'),
        subtitle: t('nav.about'),
        to: '/about/hall',
        keywords: 'ทำเนียบนายก นายกองค์การนักเรียน ประวัติ hall of presidents',
      },
      {
        id: 'page-emblem',
        group: 'page',
        title: t('nav.aboutSub.emblem'),
        subtitle: t('nav.about'),
        to: '/about/emblem',
        keywords: 'ตราสัญลักษณ์ สัตตภัณฑ์ โลโก้ emblem logo',
      },
      {
        id: 'page-authority',
        group: 'page',
        title: t('nav.aboutSub.authority'),
        subtitle: t('nav.about'),
        to: '/about/authority',
        keywords: 'อำนาจหน้าที่ ระเบียบ โครงสร้าง authority duties',
      },
      {
        id: 'page-complaint',
        group: 'page',
        title: t('nav.reportFull'),
        subtitle: 'DeSUP CARE',
        to: '/complaint',
        keywords: 'ร้องเรียน เสนอแนะ แจ้งเรื่อง desup care complaint suggestion',
      },
      {
        id: 'page-track',
        group: 'page',
        title: t('nav.trackComplaint'),
        subtitle: 'Case ID (SU-...)',
        to: '/track',
        keywords: 'ติดตาม สถานะ เรื่องร้องเรียน case id track status',
      },
      {
        id: 'page-contact',
        group: 'page',
        title: t('nav.contactUs'),
        subtitle: t('site.schoolName'),
        to: '/contact',
        keywords: 'ติดต่อ ที่อยู่ อีเมล เบอร์โทร แผนที่ contact email map',
      },
    ],
    [t]
  );

  const searchableItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [...staticPages];

    news.forEach((n) => {
      if (!n.id) return;
      const titleRes = pickL10n(n.title, n.titleEn, lang);
      const excerptRes = pickL10n(n.excerpt, n.excerptEn, lang);
      items.push({
        id: `news-${n.id}`,
        group: 'news',
        title: titleRes.text,
        subtitle: excerptRes.text || formatThaiDate(n.createdAt),
        to: `/news/read/${n.id}`,
        keywords: `${n.title} ${n.titleEn || ''} ${n.excerpt || ''} ${n.excerptEn || ''}`,
      });
    });

    events.forEach((ev, idx) => {
      const titleRes = pickL10n(ev.title, ev.titleEn, lang);
      const locRes = pickL10n(ev.location, ev.locationEn, lang);
      const dateStr = ev.startAt ? formatThaiDate(ev.startAt) : '';
      items.push({
        id: `event-${ev.id || idx}`,
        group: 'event',
        title: titleRes.text,
        subtitle: [dateStr, locRes.text].filter(Boolean).join(' · '),
        to: '/calendar',
        keywords: `${ev.title} ${ev.titleEn || ''} ${ev.location || ''} ${ev.locationEn || ''} ${ev.description || ''} ${ev.descriptionEn || ''}`,
      });
    });

    downloads.forEach((dl, idx) => {
      const titleRes = pickL10n(dl.title, dl.titleEn, lang);
      items.push({
        id: `download-${dl.id || idx}`,
        group: 'download',
        title: titleRes.text,
        subtitle: dl.fileType ? dl.fileType.toUpperCase() : '',
        to: '/downloads',
        keywords: `${dl.title} ${dl.titleEn || ''} ${dl.fileName || ''} ${dl.fileType || ''}`,
      });
    });

    people.forEach((p, idx) => {
      const nameRes = pickL10n(p.name, p.nameEn, lang);
      const posRes = pickL10n(p.position, p.positionEn, lang);
      const targetRoute =
        p.role === 'advisor'
          ? '/about/advisors'
          : p.role === 'president'
          ? '/about/hall'
          : '/about/board';
      items.push({
        id: `person-${p.id || idx}`,
        group: 'person',
        title: nameRes.text,
        subtitle: [posRes.text, p.yearTH].filter(Boolean).join(' · '),
        to: targetRoute,
        keywords: `${p.name} ${p.nameEn || ''} ${p.position || ''} ${p.positionEn || ''} ${p.yearTH || ''}`,
      });
    });

    return items;
  }, [staticPages, news, events, downloads, people, lang]);

  const trimmedQuery = queryText.trim().toLowerCase();

  const results: SearchResultItem[] = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }

    const terms = trimmedQuery.split(/\s+/).filter(Boolean);
    const matched = searchableItems.filter((item) => {
      const haystack = `${item.title} ${item.subtitle || ''} ${item.keywords}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });

    return matched.slice(0, 20);
  }, [trimmedQuery, searchableItems]);

  useEffect(() => {
    setActiveIdx(0);
  }, [trimmedQuery]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    navigate(localize(item.to));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
      return;
    }
    if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    }
  };

  const getGroupBadge = (group: SearchResultItem['group']) => {
    switch (group) {
      case 'news':
        return { label: t('search.groups.news'), Icon: Newspaper };
      case 'event':
        return { label: t('search.groups.event'), Icon: CalendarBlank };
      case 'download':
        return { label: t('search.groups.download'), Icon: FileArrowDown };
      case 'person':
        return { label: t('search.groups.person'), Icon: Users };
      default:
        return { label: t('search.groups.page'), Icon: Compass };
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('search.dialogAria')}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24 pb-8"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-anchor-bg-deep/65 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl bg-surface border border-gold-border/45 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[78vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gold-border/25 bg-surface-elevated">
              <MagnifyingGlass size={18} weight="light" className="text-gold-text shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-label={t('search.inputAria')}
                className="flex-1 bg-transparent text-sm text-heading focus:outline-none"
              />
              {queryText && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryText('');
                    inputRef.current?.focus();
                  }}
                  aria-label={t('search.clearAria')}
                  className="p-1 text-text-muted hover:text-heading transition-colors cursor-pointer"
                >
                  <X size={15} weight="light" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('site.close')}
                className="px-2 py-1 text-[11px] font-medium text-text-muted hover:text-heading border border-gold-border/30 rounded-sm transition-colors cursor-pointer"
              >
                {t('site.close')}
              </button>
            </div>

            {trimmedQuery && (
              <>
                {/* Section Header */}
                <div className="px-4 py-2 bg-bg-alt/50 border-b border-gold-border/15 flex items-center justify-between text-[11px] text-text-muted">
                  <span className="font-medium text-gold-text uppercase tracking-wider">
                    {t('search.resultsHeader', { count: results.length })}
                  </span>
                  {loadingData && <span>{t('site.loading')}</span>}
                </div>

                {/* Results List */}
                <div className="overflow-y-auto divide-y divide-gold-border/15">
                  {results.length > 0 ? (
                    results.map((item, idx) => {
                      const { label, Icon } = getGroupBadge(item.group);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isActive ? 'bg-brand-soft/65' : 'hover:bg-bg-alt/60'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-0.5 p-1.5 rounded-sm bg-surface-elevated border border-gold-border/25 text-gold-text shrink-0">
                              <Icon size={15} weight="light" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-heading truncate">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-[11px] text-text-muted truncate mt-0.5">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-sm border border-gold-border/25 bg-surface-elevated text-gold-text font-medium whitespace-nowrap">
                              {label}
                            </span>
                            <ArrowRight
                              size={14}
                              weight="light"
                              className={`text-gold-text transition-transform ${
                                isActive ? 'translate-x-0.5 opacity-100' : 'opacity-40'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-6 py-12 text-center space-y-1.5">
                      <p className="font-serif text-base text-heading">
                        {t('search.emptyTitle')}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t('search.emptyHint')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
