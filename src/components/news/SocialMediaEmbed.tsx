/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialMediaLink, SocialPlatform } from '../../types';

export function detectSocialPlatform(url: string): SocialPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'other';
}

export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      if (u.pathname.includes('/shorts/')) {
        const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
        return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
      }
      if (u.pathname.includes('/live/')) {
        const id = u.pathname.split('/live/')[1]?.split('/')[0];
        return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
      }
      if (u.pathname.includes('/embed/')) {
        const id = u.pathname.split('/embed/')[1]?.split('/')[0];
        return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
      }
      const v = u.searchParams.get('v');
      return v && /^[a-zA-Z0-9_-]{6,}$/.test(v) ? v : null;
    }
    return null;
  } catch {
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([a-zA-Z0-9_-]{6,})/i);
    return match?.[1] || null;
  }
}

export function getYouTubeEmbedUrl(url: string, autoplay = false): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`;
}

export function getYouTubeThumbnailUrl(
  url?: string,
  quality: 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function getNewsYouTubeUrl(item: {
  videoUrl?: string;
  socialLinks?: SocialMediaLink[];
}): string | null {
  if (item.videoUrl && detectSocialPlatform(item.videoUrl) === 'youtube' && extractYouTubeVideoId(item.videoUrl)) {
    return item.videoUrl.trim();
  }
  const ytLink = item.socialLinks?.find(
    (s) => s.url && detectSocialPlatform(s.url) === 'youtube' && extractYouTubeVideoId(s.url)
  );
  return ytLink?.url?.trim() || null;
}

export function getNewsCoverUrl(item: {
  coverImage?: { url?: string };
  coverUrl?: string;
  videoUrl?: string;
  socialLinks?: SocialMediaLink[];
}): string | null {
  const explicit = item.coverImage?.url || item.coverUrl;
  if (explicit && explicit.trim()) return explicit.trim();
  const ytUrl = getNewsYouTubeUrl(item);
  return ytUrl ? getYouTubeThumbnailUrl(ytUrl, 'hqdefault') : null;
}

export function isYouTubeThumbnailUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/');
}

export interface YouTubeOEmbedMeta {
  title: string;
  authorName: string;
  thumbnailUrl: string;
}

export async function fetchYouTubeOEmbed(url: string): Promise<YouTubeOEmbedMeta | null> {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;

  const canonical = `https://www.youtube.com/watch?v=${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title || '',
      authorName: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getTikTokEmbedUrl(url: string): string | null {
  const match = url.match(/tiktok\.com\/(?:@[^/]+\/)?video\/(\d+)/i);
  if (match && match[1]) {
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }
  return null;
}

function getInstagramEmbedUrl(url: string): string | null {
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1] && match[2]) {
    return `https://www.instagram.com/${match[1].toLowerCase()}/${match[2]}/embed`;
  }
  return null;
}

const PLATFORM_STYLE: Record<
  SocialPlatform,
  { nameKey?: string; fixedName?: string; colorClass: string; badgeBg: string; ctaKey: string }
> = {
  youtube: {
    fixedName: 'YouTube',
    colorClass: 'text-error',
    badgeBg: 'bg-error-bg border-error/30 text-error',
    ctaKey: 'social.cta.youtube',
  },
  facebook: {
    fixedName: 'Facebook',
    colorClass: 'text-[var(--social-fb)]',
    badgeBg: 'bg-[var(--social-fb)]/10 border-[var(--social-fb)]/30 text-[var(--social-fb)]',
    ctaKey: 'social.cta.facebook',
  },
  instagram: {
    fixedName: 'Instagram',
    colorClass: 'text-[var(--social-ig)]',
    badgeBg: 'bg-[var(--social-ig)]/10 border-[var(--social-ig)]/30 text-[var(--social-ig)]',
    ctaKey: 'social.cta.instagram',
  },
  tiktok: {
    fixedName: 'TikTok',
    colorClass: 'text-heading',
    badgeBg: 'bg-anchor-bg-deep text-anchor-text border-gold/30',
    ctaKey: 'social.cta.tiktok',
  },
  other: {
    nameKey: 'social.externalLink',
    colorClass: 'text-accent',
    badgeBg: 'bg-brand-soft border-gold-border/25 text-accent',
    ctaKey: 'social.cta.other',
  },
};

const PlatformIcon: React.FC<{ platform: SocialPlatform }> = ({ platform }) => {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 16.99 22 12z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
};

export const YouTubeLitePlayer: React.FC<{
  url: string;
  title?: string;
  eagerEmbed?: boolean;
  className?: string;
}> = ({ url, title, eagerEmbed = false, className = '' }) => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(eagerEmbed);
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const displayTitle = title || t('social.youtubeTitle');
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const embedSrc = getYouTubeEmbedUrl(url, !eagerEmbed && playing);

  return (
    <div className={`aspect-video w-full rounded-sm overflow-hidden border border-gold-border/40 shadow-editorial bg-anchor-bg-deep relative ${className}`}>
      {playing && embedSrc ? (
        <iframe
          src={embedSrc}
          title={displayTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t('social.playVideoAria', { title: displayTitle })}
          className="group relative w-full h-full block text-left focus:outline-none cursor-pointer"
        >
          <img
            src={thumbUrl}
            alt={displayTitle}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-anchor-bg-deep/65 via-anchor-bg-deep/15 to-anchor-bg-deep/10 group-hover:bg-anchor-bg-deep/35 transition-colors flex items-center justify-center">
            <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-xl bg-[var(--social-yt)]/95 group-hover:bg-[var(--social-yt)] group-hover:scale-105 transition-all flex items-center justify-center shadow-xl border border-anchor-text/25">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-anchor-text fill-current ml-0.5" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-anchor-bg-deep/80 text-anchor-text text-[10px] font-medium tracking-wide border border-anchor-text/15">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--social-yt)]" />
            YouTube
          </span>
        </button>
      )}
    </div>
  );
};

interface SocialMediaEmbedProps {
  url: string;
  platform?: SocialPlatform;
  title?: string;
  label?: string;
  eagerYouTube?: boolean;
}

export const SocialMediaEmbed: React.FC<SocialMediaEmbedProps> = ({
  url,
  platform,
  title,
  label,
  eagerYouTube = true,
}) => {
  const { t } = useTranslation();
  if (!url || !url.trim()) return null;

  const cleanUrl = url.trim();
  const displayTitle = title || t('social.defaultTitle');
  const detected = platform || detectSocialPlatform(cleanUrl);
  const style = PLATFORM_STYLE[detected];
  const platformName = style.fixedName || (style.nameKey ? t(style.nameKey) : '');
  const ctaLabel = t(style.ctaKey);

  // 1. YouTube Embed
  if (detected === 'youtube') {
    const embedSrc = getYouTubeEmbedUrl(cleanUrl);
    if (embedSrc) {
      return (
        <div className="space-y-2">
          <YouTubeLitePlayer url={cleanUrl} title={displayTitle} eagerEmbed={eagerYouTube} />
          <div className="flex justify-end">
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold-text hover:underline"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      );
    }
  }

  // 2. TikTok Video Embed
  if (detected === 'tiktok') {
    const tikTokSrc = getTikTokEmbedUrl(cleanUrl);
    if (tikTokSrc) {
      return (
        <div className="bg-surface border border-gold-border/40 rounded-sm p-4 shadow-editorial space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-xs font-semibold ${style.badgeBg}`}>
              <PlatformIcon platform="tiktok" />
              <span>{label || t('social.tiktokDefaultLabel')}</span>
            </div>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              {ctaLabel}
            </a>
          </div>
          <div className="max-w-[340px] mx-auto aspect-[9/16] rounded-sm overflow-hidden bg-anchor-bg-deep">
            <iframe
              src={tikTokSrc}
              title={displayTitle}
              allowFullScreen
              allow="encrypted-media"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      );
    }
  }

  // 3. Instagram Post/Reel Embed
  if (detected === 'instagram') {
    const igSrc = getInstagramEmbedUrl(cleanUrl);
    if (igSrc) {
      return (
        <div className="bg-surface border border-gold-border/40 rounded-sm p-4 shadow-editorial space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-xs font-semibold ${style.badgeBg}`}>
              <PlatformIcon platform="instagram" />
              <span>{label || t('social.instagramDefaultLabel')}</span>
            </div>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              {ctaLabel}
            </a>
          </div>
          <div className="max-w-[460px] mx-auto rounded-sm overflow-hidden border border-gold-border/25 bg-surface-elevated">
            <iframe
              src={igSrc}
              title={displayTitle}
              className="w-full h-[520px] border-0"
              loading="lazy"
            />
          </div>
        </div>
      );
    }
  }

  // 4. การ์ดลิงก์ Facebook หรือแพลตฟอร์มอื่น (ไม่ใช้ iframe กับ Facebook เนื่องจากข้อจำกัด X-Frame-Options)
  return (
    <a
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface border border-gold-border/40 hover:border-accent p-5 rounded-sm shadow-editorial transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`p-3 rounded-sm border shrink-0 ${style.badgeBg}`}>
            <PlatformIcon platform={detected} />
          </div>
          <div className="min-w-0 space-y-1">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${style.colorClass}`}>
              {platformName}
            </span>
            <h4 className="font-serif text-base font-semibold text-heading group-hover:text-accent transition-colors">
              {label || t('social.followDetailsOn', { platform: platformName })}
            </h4>
            <p className="text-xs text-text-muted truncate font-mono">
              {cleanUrl}
            </p>
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-brand group-hover:bg-brand-hover text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 transition-colors">
          {ctaLabel}
        </span>
      </div>
    </a>
  );
};

export const SocialMediaList: React.FC<{
  videoUrl?: string;
  socialLinks?: SocialMediaLink[];
  title?: string;
  excludeUrl?: string;
}> = ({ videoUrl, socialLinks, title, excludeUrl }) => {
  const combined: SocialMediaLink[] = [];
  const seen = new Set<string>();
  const excludedId = excludeUrl ? extractYouTubeVideoId(excludeUrl) : null;

  const shouldSkip = (raw: string): boolean => {
    if (excludeUrl && raw === excludeUrl.trim()) return true;
    if (excludedId && extractYouTubeVideoId(raw) === excludedId) return true;
    return false;
  };

  if (videoUrl && videoUrl.trim()) {
    const clean = videoUrl.trim();
    if (!shouldSkip(clean)) {
      seen.add(clean);
      combined.push({ platform: detectSocialPlatform(clean), url: clean });
    }
  }

  if (Array.isArray(socialLinks)) {
    for (const item of socialLinks) {
      const clean = item.url?.trim();
      if (clean && !seen.has(clean) && !shouldSkip(clean)) {
        seen.add(clean);
        combined.push({
          platform: item.platform || detectSocialPlatform(clean),
          url: clean,
          label: item.label,
        });
      }
    }
  }

  if (combined.length === 0) return null;

  return (
    <div className="space-y-4">
      {combined.map((item, idx) => (
        <SocialMediaEmbed
          key={`${item.url}-${idx}`}
          url={item.url}
          platform={item.platform}
          label={item.label}
          title={title}
        />
      ))}
    </div>
  );
};
