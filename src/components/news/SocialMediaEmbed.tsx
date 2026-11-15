/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

const PLATFORM_META: Record<
  SocialPlatform,
  { name: string; colorClass: string; badgeBg: string; ctaLabel: string }
> = {
  youtube: {
    name: 'YouTube',
    colorClass: 'text-red-700',
    badgeBg: 'bg-red-50 border-red-200 text-red-700',
    ctaLabel: 'เปิดดูบน YouTube ↗',
  },
  facebook: {
    name: 'Facebook',
    colorClass: 'text-[#1877F2]',
    badgeBg: 'bg-[#1877F2]/10 border-[#1877F2]/30 text-[#1877F2]',
    ctaLabel: 'เปิดดูโพสต์/วิดีโอบน Facebook ↗',
  },
  instagram: {
    name: 'Instagram',
    colorClass: 'text-[#C13584]',
    badgeBg: 'bg-[#C13584]/10 border-[#C13584]/30 text-[#C13584]',
    ctaLabel: 'เปิดดูบน Instagram ↗',
  },
  tiktok: {
    name: 'TikTok',
    colorClass: 'text-[#1B1226]',
    badgeBg: 'bg-stone-900 text-white border-stone-900',
    ctaLabel: 'เปิดดูบน TikTok ↗',
  },
  other: {
    name: 'ลิงก์ภายนอก',
    colorClass: 'text-[#4B1F7A]',
    badgeBg: 'bg-[#EDE6F5] border-[#4B1F7A]/20 text-[#4B1F7A]',
    ctaLabel: 'เปิดลิงก์ต้นทาง ↗',
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
}> = ({ url, title = 'วิดีโอ YouTube', eagerEmbed = false, className = '' }) => {
  const [playing, setPlaying] = useState(eagerEmbed);
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const embedSrc = getYouTubeEmbedUrl(url, !eagerEmbed && playing);

  return (
    <div className={`aspect-video w-full rounded-sm overflow-hidden border border-[#B8923A]/40 shadow-editorial bg-black relative ${className}`}>
      {playing && embedSrc ? (
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`เล่นวิดีโอ: ${title}`}
          className="group relative w-full h-full block text-left focus:outline-none cursor-pointer"
        >
          <img
            src={thumbUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-xl bg-[#FF0000]/95 group-hover:bg-[#FF0000] group-hover:scale-105 transition-all flex items-center justify-center shadow-xl border border-white/25">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current ml-0.5" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-black/75 text-white text-[10px] font-medium tracking-wide border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
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
  title = 'สื่อประชาสัมพันธ์',
  label,
  eagerYouTube = true,
}) => {
  if (!url || !url.trim()) return null;

  const cleanUrl = url.trim();
  const detected = platform || detectSocialPlatform(cleanUrl);
  const meta = PLATFORM_META[detected];

  // 1. YouTube Embed
  if (detected === 'youtube') {
    const embedSrc = getYouTubeEmbedUrl(cleanUrl);
    if (embedSrc) {
      return (
        <div className="space-y-2">
          <YouTubeLitePlayer url={cleanUrl} title={title} eagerEmbed={eagerYouTube} />
          <div className="flex justify-end">
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9C7A2B] hover:underline"
            >
              {meta.ctaLabel}
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
        <div className="bg-[#FAF7F0] border border-[#B8923A]/40 rounded-sm p-4 shadow-editorial space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-xs font-semibold ${meta.badgeBg}`}>
              <PlatformIcon platform="tiktok" />
              <span>{label || 'วิดีโอ TikTok'}</span>
            </div>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#4B1F7A] hover:underline"
            >
              {meta.ctaLabel}
            </a>
          </div>
          <div className="max-w-[340px] mx-auto aspect-[9/16] rounded-sm overflow-hidden bg-black">
            <iframe
              src={tikTokSrc}
              title={title}
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
        <div className="bg-[#FAF7F0] border border-[#B8923A]/40 rounded-sm p-4 shadow-editorial space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-xs font-semibold ${meta.badgeBg}`}>
              <PlatformIcon platform="instagram" />
              <span>{label || 'โพสต์ / Reels บน Instagram'}</span>
            </div>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#4B1F7A] hover:underline"
            >
              {meta.ctaLabel}
            </a>
          </div>
          <div className="max-w-[460px] mx-auto rounded-sm overflow-hidden border border-stone-200 bg-white">
            <iframe
              src={igSrc}
              title={title}
              className="w-full h-[520px] border-0"
              loading="lazy"
            />
          </div>
        </div>
      );
    }
  }

  // 4. Facebook & Shortlink / Profile Card (Never render raw Facebook URL in iframe due to X-Frame-Options)
  return (
    <a
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#FAF7F0] border border-[#B8923A]/50 hover:border-[#4B1F7A] p-5 rounded-sm shadow-editorial transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`p-3 rounded-sm border shrink-0 ${meta.badgeBg}`}>
            <PlatformIcon platform={detected} />
          </div>
          <div className="min-w-0 space-y-1">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${meta.colorClass}`}>
              {meta.name}
            </span>
            <h4 className="font-serif text-base font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors">
              {label || `ติดตามรายละเอียดเพิ่มเติมบน ${meta.name}`}
            </h4>
            <p className="text-xs text-[#1B1226]/55 truncate font-mono">
              {cleanUrl}
            </p>
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-[#4B1F7A] group-hover:bg-[#2A1245] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 transition-colors">
          {meta.ctaLabel}
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
