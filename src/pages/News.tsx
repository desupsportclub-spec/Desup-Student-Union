/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { getCachedNewsSync, loadPublishedNews } from '../lib/publicDataService';
import { NewsItem, RegulationSubType } from '../types';
import { formatDate, formatNumber } from '../lib/format';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, CornerBracket, PinIcon } from '../components/common/Ornament';
import { Emblem } from '../components/common/Emblem';
import { getNewsCoverUrl, getNewsYouTubeUrl } from '../components/news/SocialMediaEmbed';
import { LocLink } from '../components/common/LocLink';
import { SeoHead } from '../components/common/SeoHead';
import { useLanguage } from '../context/LanguageContext';
import { pickL10n } from '../lib/l10n';
import { FallbackLangBadge } from '../components/common/FallbackLangBadge';
import { REGULATION_SUBTYPES, resolveRegulationSubType } from '../config/site';

const CATEGORY_IDS = ['all', 'pr', 'activity', 'regulation', 'knowledge', 'video'] as const;

function normalizeNewsFilterCategory(cat?: string): string {
  if (!cat) return 'all';
  if (cat === 'order' || cat === 'regulation') return 'regulation';
  return cat;
}

export const News: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { category: urlCategory } = useParams<{ category?: string }>();
  const [selectedCat, setSelectedCat] = useState<string>(normalizeNewsFilterCategory(urlCategory));
  const [selectedRegType, setSelectedRegType] = useState<'all' | RegulationSubType>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialCached = getCachedNewsSync();
  const [allNews, setAllNews] = useState<NewsItem[]>(() => initialCached || []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [displayCount, setDisplayCount] = useState(9);

  useEffect(() => {
    setSelectedCat(normalizeNewsFilterCategory(urlCategory));
    setSelectedRegType('all');
    setDisplayCount(9);
  }, [urlCategory]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (searchOpen) {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [searchOpen]);

  useEffect(() => {
    let active = true;

    loadPublishedNews((items) => {
      if (!active) return;
      setAllNews(items);
      setLoading(false);
    })
      .catch((err) => {
        console.warn("Could not load news from Firestore:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredNews = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return allNews.filter((item) => {
      if (selectedCat !== 'all') {
        if (selectedCat === 'regulation') {
          if (item.category !== 'regulation' && item.category !== 'order') return false;
          if (selectedRegType !== 'all' && resolveRegulationSubType(item) !== selectedRegType) {
            return false;
          }
        } else if (item.category !== selectedCat) {
          return false;
        }
      }
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        (item.titleEn || '').toLowerCase().includes(term) ||
        (item.excerpt || '').toLowerCase().includes(term) ||
        (item.excerptEn || '').toLowerCase().includes(term)
      );
    });
  }, [allNews, selectedCat, selectedRegType, debouncedSearch]);

  const visibleNews = useMemo(
    () => filteredNews.slice(0, displayCount),
    [filteredNews, displayCount]
  );

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      <SeoHead titleKey="seo.pages.news.title" descriptionKey="seo.pages.news.desc" />

      {/* ส่วนหัวหน้าข่าวสาร */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6">
        <SectionEyebrow enText={t('news.eyebrowEn')} thText={t('news.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading mt-2">
          {t('news.title')}
        </h1>
      </div>

      {/* แถบตัวกรองหมวดหมู่และปุ่มค้นหา */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gold-border/15">
        <div className="flex-1 min-w-0 flex items-center gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
          {CATEGORY_IDS.map((catId) => (
            <button
              key={catId}
              onClick={() => {
                setSelectedCat(catId);
                setSelectedRegType('all');
                setDisplayCount(9);
              }}
              className={`pb-2 whitespace-nowrap transition-colors relative ${
                selectedCat === catId
                  ? 'text-accent font-semibold'
                  : 'text-text-muted hover:text-heading'
              }`}
            >
              <span>{t(`news.categories.${catId}`)}</span>
              {selectedCat === catId && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
              )}
            </button>
          ))}
        </div>

        {searchOpen || searchTerm ? (
          <div className="w-full md:w-64 h-9 px-3 rounded-sm border border-gold-border/40 bg-surface flex items-center gap-2 focus-within:border-gold transition-colors shrink-0">
            <MagnifyingGlass className="w-4 h-4 text-gold-text shrink-0" weight="light" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                  setSearchOpen(false);
                }
              }}
              aria-label={t('nav.searchButton')}
              className="flex-1 min-w-0 bg-transparent text-xs text-heading focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSearchOpen(false);
              }}
              aria-label={t('site.close')}
              className="text-text-muted hover:text-heading transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t('nav.searchButton')}
            title={t('nav.searchButton')}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-sm border border-gold-border/30 bg-surface/60 text-heading hover:border-gold-text hover:bg-surface transition-colors cursor-pointer shrink-0"
          >
            <MagnifyingGlass className="w-4 h-4" weight="light" />
          </button>
        )}
      </div>

      {/* ปุ่มเลือกประเภทในหน้า ข้อบังคับ ระเบียบ คำสั่ง ประกาศ */}
      {selectedCat === 'regulation' && (
        <div className="flex flex-wrap items-center gap-2 -mt-2 sm:-mt-4">
          {(['all', ...REGULATION_SUBTYPES.map((s) => s.id)] as const).map((subId) => {
            const active = selectedRegType === subId;
            return (
              <button
                key={subId}
                type="button"
                onClick={() => {
                  setSelectedRegType(subId);
                  setDisplayCount(9);
                }}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-sm border transition-colors cursor-pointer ${
                  active
                    ? 'bg-brand text-brand-contrast border-gold shadow-editorial-sm'
                    : 'bg-surface text-heading border-gold-border/35 hover:border-gold hover:bg-brand-soft/60'
                }`}
              >
                {t(`news.regulationSubTypes.${subId}`)}
              </button>
            );
          })}
        </div>
      )}

      {/* รายการข่าวสาร */}
      {loading && allNews.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-4 border border-gold-border/15 rounded-sm bg-surface">
              <div className="aspect-[16/9] bg-bg-alt rounded-sm" />
              <div className="h-4 bg-bg-alt rounded w-1/3" />
              <div className="h-5 bg-bg-alt rounded w-3/4" />
              <div className="h-3 bg-bg-alt rounded w-full" />
            </div>
          ))}
        </div>
      ) : visibleNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {visibleNews.map((item, idx) => {
            const titleRes = pickL10n(item.title, item.titleEn, lang);
            const excerptRes = pickL10n(item.excerpt, item.excerptEn, lang);
            return (
              <LocLink
                key={item.id}
                to={`/news/read/${item.id}`}
                className="group block relative border border-gold-border/20 bg-surface p-4 sm:p-5 rounded-sm shadow-editorial transition-all duration-300 hover:border-gold flex flex-col justify-between"
              >
                <CornerBracket position="top-left" />
                <CornerBracket position="top-right" />
                <CornerBracket position="bottom-left" />
                <CornerBracket position="bottom-right" />

                <div>
                  <div className="aspect-[16/9] bg-bg-alt overflow-hidden mb-4 rounded-sm relative">
                    {getNewsCoverUrl(item) ? (
                      <img
                        src={getNewsCoverUrl(item) || ''}
                        alt={titleRes.text}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-soft flex items-center justify-center text-accent">
                        <Emblem size={44} />
                      </div>
                    )}

                    {(item.category === 'video' || getNewsYouTubeUrl(item)) && (
                      <div className="absolute inset-0 bg-anchor-bg-deep/25 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gold text-anchor-bg-deep flex items-center justify-center shadow-lg">
                          ▶
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-brand text-brand-contrast text-[10px] font-medium">
                          <PinIcon className="w-3 h-3 text-gold-light" />
                          <span>{t('home.pinnedTag')}</span>
                        </span>
                      )}
                      <NewsCategoryBadge
                        category={item.category}
                        regulationType={resolveRegulationSubType(item)}
                      />
                      <span aria-hidden="true">·</span>
                      <span>{formatDate(item.createdAt, lang, true)}</span>
                      <FallbackLangBadge show={titleRes.isFallback} />
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-heading group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {titleRes.text}
                    </h3>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {excerptRes.text || t('news.cardFallbackExcerpt')}
                    </p>
                  </div>
                </div>

              <div className="pt-4 mt-4 border-t border-gold-border/15 flex items-center justify-between text-[11px] text-text-muted">
                <span>{t('site.viewsCount', { count: formatNumber(item.views, lang) })}</span>
                <span className="text-gold-text group-hover:translate-x-1 transition-transform">
                  {t('site.readMore')}
                </span>
              </div>
            </LocLink>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/50 space-y-2">
          <p className="font-serif text-lg text-heading">
            {searchTerm
              ? t('news.emptySearch', { term: searchTerm })
              : t('news.emptyCategory')}
          </p>
          <p className="text-xs text-text-muted">
            {t('news.emptyHint')}
          </p>
        </div>
      )}

      {/* ปุ่มโหลดเพิ่มเติม */}
      {filteredNews.length > displayCount && (
        <div className="text-center pt-8">
          <button
            onClick={() => setDisplayCount((prev) => prev + 9)}
            className="px-8 py-2.5 border border-gold text-xs font-medium text-heading hover:bg-brand hover:text-brand-contrast transition-colors duration-300 rounded-sm"
          >
            {t('news.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};
