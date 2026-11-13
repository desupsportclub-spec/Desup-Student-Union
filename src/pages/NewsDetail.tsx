/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem } from '../types';
import { formatThaiDate, formatNumber } from '../lib/format';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, SectionDivider } from '../components/common/Ornament';
import { Emblem } from '../components/common/Emblem';
import { SocialMediaList, detectSocialPlatform } from '../components/news/SocialMediaEmbed';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyNotice, setCopyNotice] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function loadArticle() {
      if (!id) return;
      setLoading(true);

      try {
        const docRef = doc(db, 'news', id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as NewsItem;
          setNews(data);

          // Increment view count once per browser session for this article
          const sessionKey = `desup_view_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            try {
              await updateDoc(docRef, {
                views: increment(1)
              });
              setNews(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
            } catch (e) {
              // Ignore view increment error
            }
          }

          // Fetch 3 related news in the same category (filtered client-side to avoid composite index)
          const relQuery = query(
            collection(db, 'news'),
            where('published', '==', true)
          );
          const relSnap = await getDocs(relQuery);
          const relList: NewsItem[] = [];
          relSnap.forEach((d) => {
            const item = { id: d.id, ...d.data() } as NewsItem;
            if (d.id !== id && item.category === data.category) {
              relList.push(item);
            }
          });
          relList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setRelated(relList.slice(0, 3));
        }
      } catch (err) {
        console.warn("Could not load article:", err);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 2000);
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleShareLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-stone-200 rounded w-1/4" />
        <div className="h-10 bg-stone-200 rounded w-full" />
        <div className="aspect-[16/9] bg-stone-200 rounded" />
        <div className="h-4 bg-stone-200 rounded w-full" />
        <div className="h-4 bg-stone-200 rounded w-5/6" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-20 text-center space-y-4">
        <Emblem size={64} className="mx-auto" />
        <h1 className="font-serif text-2xl text-[#2A1245]">ไม่พบข่าวสารที่ต้องการ</h1>
        <p className="text-xs text-[#1B1226]/60">ข่าวสารนี้อาจถูกลบ ย้าย หรือยังไม่ได้รับการเผยแพร่</p>
        <Link to="/news" className="inline-block mt-4 px-6 py-2 bg-[#4B1F7A] text-[#FAF7F0] text-xs rounded-sm">
          กลับสู่หน้ารวมข่าว
        </Link>
      </div>
    );
  }

  const galleryImages = news.gallery || (news.galleryUrls?.map(url => ({ url, alt: news.title })) || []);

  // Extract any direct Facebook/Instagram/TikTok iframe blocks mistakenly embedded in content
  const extractedSocialUrls: string[] = [];
  const sanitizedContent = (news.content || '').replace(
    /<iframe[^>]+src=["']([^"']*(?:facebook\.com|fb\.watch|instagram\.com|tiktok\.com)[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (_match, src: string) => {
      if (src) extractedSocialUrls.push(src);
      return '';
    }
  );

  const combinedSocialLinks = [
    ...(news.socialLinks || []),
    ...extractedSocialUrls
      .filter((u) => u !== news.videoUrl && !(news.socialLinks || []).some((s) => s.url === u))
      .map((u) => ({ platform: detectSocialPlatform(u), url: u })),
  ];

  return (
    <article className="py-12">
      <div className="max-w-[760px] mx-auto px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#1B1226]/60">
          <Link to="/" className="hover:text-[#4B1F7A]">หน้าหลัก</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-[#4B1F7A]">ข่าวสาร</Link>
          <span>/</span>
          <NewsCategoryBadge category={news.category} />
        </div>

        {/* Article Header */}
        <div className="space-y-4 border-b border-[#B8923A]/30 pb-6">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1B1226] leading-tight">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#1B1226]/70 gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span>{formatThaiDate(news.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span>อ่าน {formatNumber(news.views)} ครั้ง</span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 border border-[#4B1F7A]/20 hover:border-[#B8923A] rounded-sm text-[11px] transition-colors"
                title="คัดลอกลิงก์"
              >
                {copyNotice ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
              </button>
              <button
                type="button"
                onClick={handleShareFacebook}
                className="px-2.5 py-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-sm text-[11px] transition-colors"
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={handleShareLine}
                className="px-2.5 py-1 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#06C755] rounded-sm text-[11px] transition-colors"
              >
                LINE
              </button>
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        {(news.coverImage?.url || news.coverUrl) && (
          <div className="aspect-[16/9] overflow-hidden rounded-sm border border-[#4B1F7A]/20 shadow-editorial bg-stone-100">
            <img
              src={news.coverImage?.url || news.coverUrl}
              alt={news.coverImage?.alt || news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Excerpt if present */}
        {news.excerpt && (
          <div className="text-base font-serif italic text-[#4B1F7A] bg-[#EDE6F5]/40 p-4 border-l-2 border-[#B8923A] rounded-r-sm">
            {news.excerpt}
          </div>
        )}

        {/* Rich HTML Content from Tiptap */}
        <div
          className="text-[17px] md:text-[18px] text-[#1B1226] leading-[1.8] space-y-4 font-sans prose-custom"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Video & Social Media Links (YouTube, Facebook, Instagram, TikTok) */}
        {(news.videoUrl || combinedSocialLinks.length > 0) && (
          <div className="pt-4">
            <SocialMediaList
              videoUrl={news.videoUrl}
              socialLinks={combinedSocialLinks}
              title={news.title}
            />
          </div>
        )}

        {/* Gallery Lightbox */}
        {galleryImages.length > 0 && (
          <div className="pt-8 space-y-4 border-t border-[#4B1F7A]/15">
            <h3 className="font-serif text-lg font-semibold text-[#1B1226]">
              ภาพประกอบกิจกรรม ({galleryImages.length} รูป)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="aspect-[4/3] rounded-sm overflow-hidden border border-[#4B1F7A]/15 bg-stone-100 cursor-pointer group"
                >
                  <img
                    src={img.url}
                    alt={img.alt || `ภาพประกอบ ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              index={lightboxIndex}
              slides={galleryImages.map(img => ({ src: img.url, title: img.alt }))}
            />
          </div>
        )}

        {/* File Attachments */}
        {news.attachments && news.attachments.length > 0 && (
          <div className="pt-6 space-y-3 border-t border-[#4B1F7A]/15">
            <h3 className="font-serif text-lg font-semibold text-[#1B1226]">
              เอกสารแนบที่เกี่ยวข้อง
            </h3>
            <div className="space-y-2">
              {news.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border border-[#4B1F7A]/15 bg-[#FAF7F0] hover:bg-[#EDE6F5] rounded-sm text-xs transition-colors"
                >
                  <span className="font-medium text-[#2A1245]">📄 {att.name}</span>
                  <span className="text-[#9C7A2B]">ดาวน์โหลด ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <SectionDivider className="my-14" />

        {/* Related News (3 items) */}
        {related.length > 0 && (
          <div className="space-y-6 pt-2">
            <SectionEyebrow enText="RELATED" thText="ข่าวสารที่เกี่ยวข้อง" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/read/${item.id}`}
                  className="group block border border-[#4B1F7A]/15 p-3 rounded-sm hover:border-[#B8923A] transition-colors"
                >
                  <div className="aspect-[16/9] bg-stone-100 rounded-sm overflow-hidden mb-2">
                    {item.coverImage?.url || item.coverUrl ? (
                      <img
                        src={item.coverImage?.url || item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EDE6F5] flex items-center justify-center">
                        <Emblem size={24} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-serif text-xs font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[#1B1226]/60 mt-1">
                    {formatThaiDate(item.createdAt, true)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
