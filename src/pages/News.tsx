/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCachedNewsSync, loadPublishedNews } from '../lib/publicDataService';
import { NewsItem } from '../types';
import { formatThaiDate, formatNumber } from '../lib/format';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { Emblem } from '../components/common/Emblem';
import { getNewsCoverUrl, getNewsYouTubeUrl } from '../components/news/SocialMediaEmbed';

const CATEGORIES: { id: string; label: string; en: string }[] = [
  { id: 'all', label: 'ทั้งหมด', en: 'ALL' },
  { id: 'pr', label: 'ข่าวประชาสัมพันธ์', en: 'PR' },
  { id: 'activity', label: 'ภาพข่าวกิจกรรม', en: 'ACTIVITIES' },
  { id: 'regulation', label: 'ข้อบังคับและระเบียบ', en: 'REGULATIONS' },
  { id: 'order', label: 'คำสั่งและประกาศ', en: 'ORDERS' },
  { id: 'knowledge', label: 'สาระน่ารู้', en: 'KNOWLEDGE' },
  { id: 'video', label: 'คลิปวิดีโอ', en: 'VIDEOS' },
];

export const News: React.FC = () => {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const [selectedCat, setSelectedCat] = useState<string>(urlCategory || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const initialCached = getCachedNewsSync();
  const [allNews, setAllNews] = useState<NewsItem[]>(() => initialCached || []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [displayCount, setDisplayCount] = useState(9);

  // Sync with URL param if changes and reset pagination count
  useEffect(() => {
    setSelectedCat(urlCategory || 'all');
    setDisplayCount(9);
  }, [urlCategory]);

  // Debounce search input by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch published news ONCE via cache-first publicDataService (switching categories never re-fetches!)
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

  // Filter instantaneously client-side by selected category & debounced search term
  const filteredNews = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return allNews.filter((item) => {
      if (selectedCat !== 'all' && item.category !== selectedCat) return false;
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.excerpt?.toLowerCase().includes(term)
      );
    });
  }, [allNews, selectedCat, debouncedSearch]);

  const visibleNews = useMemo(
    () => filteredNews.slice(0, displayCount),
    [filteredNews, displayCount]
  );

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Page Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6">
        <SectionEyebrow enText="PRESS & UPDATES" thText="ข่าวสารและประกาศ" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226] mt-2">
          ข่าวสารองค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70 mt-1">
          รวมข่าวประชาสัมพันธ์ กิจกรรม ข้อบังคับ ประกาศ และสาระน่ารู้
        </p>
      </div>

      {/* Filter Tabs & Live Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#4B1F7A]/10">
        {/* Underline tabs */}
        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCat(cat.id);
                setDisplayCount(9);
              }}
              className={`pb-2 whitespace-nowrap transition-colors relative ${
                selectedCat === cat.id
                  ? 'text-[#4B1F7A] font-semibold'
                  : 'text-[#1B1226]/60 hover:text-[#2A1245]'
              }`}
            >
              <span>{cat.label}</span>
              {selectedCat === cat.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B8923A]" />
              )}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามหัวข้อข่าว..."
            className="w-full text-xs input-underline pr-6"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-2.5 text-xs text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* News Grid */}
      {loading && allNews.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-4 border border-stone-200 rounded-sm">
              <div className="aspect-[16/9] bg-stone-200 rounded-sm" />
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-5 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : visibleNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {visibleNews.map((item, idx) => (
            <Link
              key={item.id}
              to={`/news/read/${item.id}`}
              className="group block relative border border-[#4B1F7A]/15 bg-[#FAF7F0] p-4 sm:p-5 rounded-sm shadow-editorial transition-all duration-300 hover:border-[#B8923A]/70 flex flex-col justify-between"
            >
              <CornerBracket position="top-left" />
              <CornerBracket position="top-right" />
              <CornerBracket position="bottom-left" />
              <CornerBracket position="bottom-right" />

              <div>
                <div className="aspect-[16/9] bg-stone-100 overflow-hidden mb-4 rounded-sm relative">
                  {getNewsCoverUrl(item) ? (
                    <img
                      src={getNewsCoverUrl(item) || ''}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      loading={idx < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center text-[#4B1F7A]">
                      <Emblem size={44} />
                    </div>
                  )}

                  {(item.category === 'video' || getNewsYouTubeUrl(item)) && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#B8923A] text-white flex items-center justify-center shadow-lg">
                        ▶
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#1B1226]/60">
                    {item.pinned && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-[#4B1F7A] text-[#FAF7F0] text-[10px] font-medium">
                        📌 ปักหมุด
                      </span>
                    )}
                    <NewsCategoryBadge category={item.category} />
                    <span aria-hidden="true">·</span>
                    <span>{formatThaiDate(item.createdAt, true)}</span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#1B1226]/70 line-clamp-2 leading-relaxed">
                    {item.excerpt || 'คลิกเพื่ออ่านรายละเอียดเนื้อหาข่าว'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#4B1F7A]/10 flex items-center justify-between text-[11px] text-[#1B1226]/60">
                <span>อ่าน {formatNumber(item.views)} ครั้ง</span>
                <span className="text-[#9C7A2B] group-hover:translate-x-1 transition-transform">
                  อ่านต่อ →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/30 space-y-2">
          <p className="font-serif text-lg text-[#2A1245]">
            {searchTerm
              ? `ไม่พบข่าวที่ตรงกับคำค้นหา "${searchTerm}"`
              : 'ยังไม่มีข่าวในหมวดหมู่นี้ในขณะนี้'}
          </p>
          <p className="text-xs text-[#1B1226]/60">
            โปรดลองเลือกหมวดหมู่อื่น หรือกลับมาตรวจสอบอีกครั้งในภายหลัง
          </p>
        </div>
      )}

      {/* Load More Button */}
      {filteredNews.length > displayCount && (
        <div className="text-center pt-8">
          <button
            onClick={() => setDisplayCount((prev) => prev + 9)}
            className="px-8 py-2.5 border border-[#B8923A] text-xs font-medium text-[#2A1245] hover:bg-[#4B1F7A] hover:text-[#FAF7F0] transition-colors duration-300 rounded-sm"
          >
            โหลดข่าวสารเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  );
};
