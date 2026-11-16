/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCachedNewsSync, loadNewsArticle, loadPublishedNews } from '../lib/publicDataService';
import { NewsItem } from '../types';
import { formatThaiDate, formatNumber } from '../lib/format';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { SectionEyebrow, SectionDivider } from '../components/common/Ornament';
import { Emblem } from '../components/common/Emblem';
import {
  SocialMediaEmbed,
  SocialMediaList,
  detectSocialPlatform,
  getNewsCoverUrl,
  getNewsYouTubeUrl,
  isYouTubeThumbnailUrl,
} from '../components/news/SocialMediaEmbed';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const initialCachedItem = id ? getCachedNewsSync()?.find((n) => n.id === id) || null : null;
  const [news, setNews] = useState<NewsItem | null>(() => initialCachedItem);
  const [related, setRelated] = useState<NewsItem[]>(() => {
    if (!initialCachedItem) return [];
    return (getCachedNewsSync() || [])
      .filter((n) => n.id !== id && n.category === initialCachedItem.category)
      .slice(0, 3);
  });
  const [loading, setLoading] = useState<boolean>(() => !initialCachedItem);
  const [copyNotice, setCopyNotice] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const cachedMatch = getCachedNewsSync()?.find((n) => n.id === id) || null;
    if (cachedMatch) {
      setNews(cachedMatch);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function loadArticle() {
      if (!id) return;
      try {
        const resolved = await loadNewsArticle(id, (item) => {
          if (!active) return;
          if (item) {
            setNews(item);
            setLoading(false);
          }
        });

        if (!active) return;
        setLoading(false);

        if (resolved) {
          // Increment view count once per browser session for this article (non-blocking)
          const sessionKey = `desup_view_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            updateDoc(doc(db, 'news', id), { views: increment(1) })
              .then(() => {
                if (active) {
                  setNews((prev) => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
                }
              })
              .catch(() => {});
          }

          // Compute related articles from shared cache (avoids redundant full Firestore scan)
          loadPublishedNews((allItems) => {
            if (!active) return;
            const relList = allItems
              .filter((item) => item.id !== id && item.category === resolved.category)
              .slice(0, 3);
            setRelated(relList);
          }).catch(() => {});
        } else {
          setNews(null);
        }
      } catch (err) {
        console.warn("Could not load article:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticle();

    return () => {
      active = false;
    };
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
        <div className="h-6 bg-bg-alt rounded w-1/4" />
        <div className="h-10 bg-bg-alt rounded w-full" />
        <div className="aspect-[16/9] bg-bg-alt rounded" />
        <div className="h-4 bg-bg-alt rounded w-full" />
        <div className="h-4 bg-bg-alt rounded w-5/6" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-20 text-center space-y-4">
        <Emblem size={64} className="mx-auto" />
        <h1 className="font-serif text-2xl text-heading">ไม่พบข่าวสารที่ต้องการ</h1>
        <p className="text-xs text-text-muted">ข่าวสารนี้อาจถูกลบ ย้าย หรือยังไม่ได้รับการเผยแพร่</p>
        <Link to="/news" className="inline-block mt-4 px-6 py-2 bg-brand text-brand-contrast hover:bg-brand-hover text-xs rounded-sm transition-colors">
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

  const primaryYouTubeUrl = getNewsYouTubeUrl({
    videoUrl: news.videoUrl,
    socialLinks: combinedSocialLinks,
  });
  const explicitCover = news.coverImage?.url || news.coverUrl || '';
  const hasCustomCover = Boolean(explicitCover && !isYouTubeThumbnailUrl(explicitCover));
  const showHeroYouTube = Boolean(primaryYouTubeUrl && (news.category === 'video' || !hasCustomCover));

  return (
    <article className="py-6 sm:py-12">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <Link to="/" className="hover:text-accent">หน้าหลัก</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-accent">ข่าวสาร</Link>
          <span>/</span>
          <NewsCategoryBadge category={news.category} />
        </div>

        {/* Article Header */}
        <div className="space-y-4 border-b border-gold-border/30 pb-6">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-heading leading-tight">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between text-xs text-text-muted gap-4 pt-2">
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
                className="px-2.5 py-1 border border-gold-border/25 hover:border-gold text-text rounded-sm text-[11px] transition-colors"
                title="คัดลอกลิงก์"
              >
                {copyNotice ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
              </button>
              <button
                type="button"
                onClick={handleShareFacebook}
                className="px-2.5 py-1 bg-[var(--social-fb)]/10 hover:bg-[var(--social-fb)]/20 text-[var(--social-fb)] rounded-sm text-[11px] transition-colors"
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={handleShareLine}
                className="px-2.5 py-1 bg-[var(--social-line)]/10 hover:bg-[var(--social-line)]/20 text-[var(--social-line)] rounded-sm text-[11px] transition-colors"
              >
                LINE
              </button>
            </div>
          </div>
        </div>

        {/* Hero Media: Live YouTube Player (when video post or no custom cover) OR Cover Photo */}
        {showHeroYouTube && primaryYouTubeUrl ? (
          <SocialMediaEmbed url={primaryYouTubeUrl} title={news.title} eagerYouTube />
        ) : explicitCover ? (
          <div className="aspect-[16/9] overflow-hidden rounded-sm border border-gold-border/25 shadow-editorial bg-bg-alt">
            <img
              src={explicitCover}
              alt={news.coverImage?.alt || news.title}
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        {/* Excerpt if present */}
        {news.excerpt && (
          <div className="text-base font-serif italic text-accent bg-brand-soft/45 p-4 border-l-2 border-gold rounded-r-sm">
            {news.excerpt}
          </div>
        )}

        {/* Rich HTML Content from Tiptap */}
        <div
          className="text-[15px] sm:text-[17px] md:text-[18px] text-text leading-[1.8] space-y-4 font-sans prose-custom break-words"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Video & Social Media Links (YouTube, Facebook, Instagram, TikTok) */}
        {(news.videoUrl || combinedSocialLinks.length > 0) && (
          <div className="pt-4">
            <SocialMediaList
              videoUrl={news.videoUrl}
              socialLinks={combinedSocialLinks}
              title={news.title}
              excludeUrl={showHeroYouTube ? primaryYouTubeUrl || undefined : undefined}
            />
          </div>
        )}

        {/* Gallery Lightbox */}
        {galleryImages.length > 0 && (
          <div className="pt-8 space-y-4 border-t border-gold-border/20">
            <h3 className="font-serif text-lg font-semibold text-heading">
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
                  className="aspect-[4/3] rounded-sm overflow-hidden border border-gold-border/20 bg-bg-alt cursor-pointer group"
                >
                  <img
                    src={img.url}
                    alt={img.alt || `ภาพประกอบ ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
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
          <div className="pt-6 space-y-3 border-t border-gold-border/20">
            <h3 className="font-serif text-lg font-semibold text-heading">
              เอกสารแนบที่เกี่ยวข้อง
            </h3>
            <div className="space-y-2">
              {news.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border border-gold-border/20 bg-surface hover:bg-brand-soft rounded-sm text-xs transition-colors"
                >
                  <span className="font-medium text-heading">📄 {att.name}</span>
                  <span className="text-gold-text">ดาวน์โหลด ↗</span>
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
                  className="group block border border-gold-border/20 bg-surface p-3 rounded-sm hover:border-gold transition-colors"
                >
                  <div className="aspect-[16/9] bg-bg-alt rounded-sm overflow-hidden mb-2">
                    {getNewsCoverUrl(item) ? (
                      <img
                        src={getNewsCoverUrl(item) || ''}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-soft flex items-center justify-center">
                        <Emblem size={24} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-serif text-xs font-semibold text-heading group-hover:text-accent line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-text-muted mt-1">
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
