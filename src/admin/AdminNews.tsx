/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem, NewsCategory, ImageAsset, SocialMediaLink } from '../types';
import { formatThaiDate, slugifyThai } from '../lib/format';
import { NewsCategoryBadge } from '../components/common/StatusBadge';
import { ImageUploader } from '../components/common/ImageUploader';
import {
  detectSocialPlatform,
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  getNewsCoverUrl,
  getYouTubeThumbnailUrl,
  isYouTubeThumbnailUrl,
  YouTubeLitePlayer,
} from '../components/news/SocialMediaEmbed';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { PinIcon } from '../components/common/Ornament';
import { invalidatePublicDataCache } from '../lib/publicDataService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  other: 'ลิงก์ภายนอก',
};

interface YouTubePreviewState {
  videoId: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  authorName: string;
  loading: boolean;
}

export const AdminNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);
  const [pinNotice, setPinNotice] = useState<string>('');
  const [search, setSearch] = useState('');
  const [successModalTitle, setSuccessModalTitle] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NewsCategory>('pr');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState<ImageAsset>({ url: '', alt: '' });
  const [videoUrl, setVideoUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [published, setPublished] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [ytPreview, setYtPreview] = useState<YouTubePreviewState | null>(null);

  // Tiptap Editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'news'));
      const list: NewsItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as NewsItem);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNews(list);
    } catch (err) {
      console.warn("Could not fetch news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Automatically pull YouTube thumbnail & metadata whenever videoUrl (or added YouTube social link) is provided
  useEffect(() => {
    if (!isModalOpen) return;

    const firstSocialYt = socialLinks.find(
      (s) => s.url && detectSocialPlatform(s.url) === 'youtube' && extractYouTubeVideoId(s.url)
    )?.url;
    const candidateUrl =
      (videoUrl && extractYouTubeVideoId(videoUrl) ? videoUrl.trim() : '') ||
      firstSocialYt ||
      '';

    const ytId = extractYouTubeVideoId(candidateUrl);
    if (!ytId || !candidateUrl) {
      setYtPreview(null);
      return;
    }

    const thumbUrl = getYouTubeThumbnailUrl(candidateUrl, 'hqdefault') || '';
    let cancelled = false;

    setYtPreview((prev) => ({
      videoId: ytId,
      url: candidateUrl,
      thumbnailUrl: thumbUrl,
      title: prev?.videoId === ytId ? prev.title : '',
      authorName: prev?.videoId === ytId ? prev.authorName : '',
      loading: true,
    }));

    // Auto-fill cover image with YouTube thumbnail when empty or when replacing a previous auto-YT thumbnail
    setCoverImage((prev) => {
      if (!prev.url || isYouTubeThumbnailUrl(prev.url)) {
        return { url: thumbUrl, alt: prev.alt || title || 'ภาพปกวิดีโอ YouTube' };
      }
      return prev;
    });

    const timer = setTimeout(async () => {
      const meta = await fetchYouTubeOEmbed(candidateUrl);
      if (cancelled) return;

      setYtPreview({
        videoId: ytId,
        url: candidateUrl,
        thumbnailUrl: thumbUrl,
        title: meta?.title || '',
        authorName: meta?.authorName || '',
        loading: false,
      });

      if (meta?.title) {
        setTitle((prev) => (prev.trim() ? prev : meta.title));
        setCoverImage((prev) => {
          if (!prev.url || isYouTubeThumbnailUrl(prev.url)) {
            return { url: thumbUrl, alt: meta.title };
          }
          return prev;
        });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [videoUrl, socialLinks, isModalOpen]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('pr');
    setExcerpt('');
    setCoverImage({ url: '', alt: '' });
    setVideoUrl('');
    setSocialLinks([]);
    setNewSocialUrl('');
    setNewSocialLabel('');
    setPublished(true);
    setPinned(false);
    setYtPreview(null);
    if (editor) editor.commands.setContent('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NewsItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category === 'order' ? 'regulation' : item.category);
    setExcerpt(item.excerpt || '');
    setCoverImage(item.coverImage || (item.coverUrl ? { url: item.coverUrl, alt: item.title } : { url: '', alt: '' }));
    setVideoUrl(item.videoUrl || '');
    setSocialLinks(item.socialLinks || []);
    setNewSocialUrl('');
    setNewSocialLabel('');
    setPublished(item.published);
    setPinned(item.pinned || false);
    setYtPreview(null);
    if (editor) editor.commands.setContent(item.content || '');
    setIsModalOpen(true);
  };

  const handleAddSocialLink = () => {
    const cleanUrl = newSocialUrl.trim();
    if (!cleanUrl) return;
    const platform = detectSocialPlatform(cleanUrl);

    // If main videoUrl is empty and user pasted a YouTube link here, also fill videoUrl automatically
    if (!videoUrl.trim() && platform === 'youtube') {
      setVideoUrl(cleanUrl);
    }

    setSocialLinks(prev => [
      ...prev,
      {
        platform,
        url: cleanUrl,
        label: newSocialLabel.trim() || undefined,
      }
    ]);
    setNewSocialUrl('');
    setNewSocialLabel('');
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleTogglePin = async (item: NewsItem) => {
    if (!item.id) return;
    const nextPinned = !item.pinned;
    setTogglingPinId(item.id);
    try {
      await updateDoc(doc(db, 'news', item.id), {
        pinned: nextPinned,
        updatedAt: new Date().toISOString(),
      });
      invalidatePublicDataCache('news');
      setNews((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, pinned: nextPinned } : n))
      );
      setPinNotice(
        nextPinned
          ? `ปักหมุด "${item.title}" ขึ้นหน้าแรกเรียบร้อยแล้ว`
          : `ยกเลิกการปักหมุด "${item.title}" ออกจากหน้าแรกแล้ว`
      );
      setTimeout(() => setPinNotice(''), 3500);
    } catch (err) {
      console.error('Toggle pin failed:', err);
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanPrimaryVideo = videoUrl.trim();
    const primaryYtId = extractYouTubeVideoId(cleanPrimaryVideo);

    // Auto-include typed link if user forgot to press the "+" button, and avoid duplicates with primary videoUrl
    const rawSocialLinks = [...socialLinks];
    if (newSocialUrl.trim()) {
      rawSocialLinks.push({
        platform: detectSocialPlatform(newSocialUrl.trim()),
        url: newSocialUrl.trim(),
        label: newSocialLabel.trim() || undefined,
      });
    }

    const seenUrls = new Set<string>(cleanPrimaryVideo ? [cleanPrimaryVideo] : []);
    const finalSocialLinks = rawSocialLinks.filter((sl) => {
      const clean = sl.url?.trim();
      if (!clean || seenUrls.has(clean)) return false;
      const slYtId = extractYouTubeVideoId(clean);
      if (primaryYtId && slYtId && slYtId === primaryYtId) return false;
      seenUrls.add(clean);
      return true;
    });

    // Auto-attach YouTube thumbnail if no custom cover image was uploaded
    let finalCoverImage = coverImage;
    if (!finalCoverImage?.url) {
      const autoThumb = getYouTubeThumbnailUrl(
        cleanPrimaryVideo || finalSocialLinks.find((s) => extractYouTubeVideoId(s.url))?.url,
        'hqdefault'
      );
      if (autoThumb) {
        finalCoverImage = { url: autoThumb, alt: title.trim() };
      }
    }

    setSaving(true);
    const contentHTML = editor ? editor.getHTML() : '';
    const now = new Date().toISOString();

    try {
      const id = editingItem?.id || doc(collection(db, 'news')).id;
      const newsDoc: NewsItem = {
        title: title.trim(),
        slug: slugifyThai(title.trim()),
        category,
        excerpt: excerpt.trim(),
        content: contentHTML,
        coverImage: finalCoverImage,
        videoUrl: cleanPrimaryVideo,
        socialLinks: finalSocialLinks,
        published,
        pinned,
        views: editingItem?.views || 0,
        createdAt: editingItem?.createdAt || now,
        updatedAt: now
      };

      await setDoc(doc(db, 'news', id), newsDoc);
      invalidatePublicDataCache('news');
      setIsModalOpen(false);
      await fetchNews();
      setSuccessModalTitle(editingItem ? 'บันทึกการแก้ไขข่าวสารเรียบร้อยแล้ว' : 'เผยแพร่ข่าวสารใหม่เรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save news failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบข่าว "${itemTitle}" หรือไม่?`)) return;

    try {
      await deleteDoc(doc(db, 'news', id));
      invalidatePublicDataCache('news');
      await fetchNews();
      setSuccessModalTitle('ลบข่าวสารเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete news failed:", err);
    }
  };

  const filteredNews = news.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
            จัดการข่าวสารและประกาศ
          </h1>
          <p className="text-xs text-[#1B1226]/60">
            สร้าง แก้ไข กดปุ่มปักหมุดขึ้นหน้าแรก และดึงวิดีโอ/ปกจาก YouTube อัตโนมัติ
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors shadow-sm self-start sm:self-auto"
        >
          + สร้างข่าวใหม่
        </button>
      </div>

      {/* Inline Pin Feedback */}
      {pinNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-medium flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <PinIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>{pinNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setPinNotice('')}
            className="text-emerald-700 hover:underline text-[11px]"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="w-full max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาตามหัวข้อข่าว..."
          className="w-full text-xs input-underline bg-white px-3 py-2 border rounded-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">กำลังโหลดข่าวสาร...</div>
        ) : filteredNews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">หัวข้อข่าว</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">ปักหมุดหน้าแรก</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">ยอดอ่าน</th>
                  <th className="py-3 px-4">วันที่สร้าง</th>
                  <th className="py-3 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredNews.map((item) => {
                  const thumb = getNewsCoverUrl(item);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4 font-medium text-[#1B1226] max-w-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              className="w-11 h-7 object-cover rounded-sm border border-stone-200 shrink-0"
                            />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <NewsCategoryBadge category={item.category} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item)}
                          disabled={togglingPinId === item.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[11px] font-medium transition-colors cursor-pointer ${
                            item.pinned
                              ? 'bg-[#4B1F7A] text-[#FAF7F0] border-[#4B1F7A] hover:bg-[#2A1245]'
                              : 'bg-[#FAF7F0] text-[#4B1F7A] border-[#B8923A]/50 hover:bg-[#EDE6F5]'
                          } disabled:opacity-50`}
                          title={item.pinned ? 'คลิกเพื่อยกเลิกปักหมุดหน้าแรก' : 'คลิกเพื่อปักหมุดแสดงบนหน้าแรก'}
                        >
                          <PinIcon
                            className={`w-3.5 h-3.5 ${
                              item.pinned ? 'text-[#D9B867]' : 'text-[#4B1F7A]'
                            }`}
                          />
                          <span>
                            {togglingPinId === item.id
                              ? 'กำลังบันทึก...'
                              : item.pinned
                              ? 'ปักหมุดหน้าแรกแล้ว'
                              : 'ปักหมุดหน้าแรก'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.published ? (
                          <span className="text-emerald-700 font-medium">เผยแพร่แล้ว</span>
                        ) : (
                          <span className="text-stone-400">ฉบับร่าง</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-numbers">
                        {item.views || 0}
                      </td>
                      <td className="py-3 px-4 text-[#1B1226]/60 whitespace-nowrap">
                        {formatThaiDate(item.createdAt, true)}
                      </td>
                      <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-[#4B1F7A] hover:underline"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!, item.title)}
                          className="text-[#9B1C31] hover:underline"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#1B1226]/60">
            ยังไม่มีข่าวสารในระบบ กดปุ่ม "สร้างข่าวใหม่" เพื่อเริ่มเขียนข่าวแรก
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-[#B8923A]/40 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-editorial my-8">
            <div className="flex items-center justify-between border-b border-[#4B1F7A]/15 pb-4">
              <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
                {editingItem ? 'แก้ไขข่าวสาร' : 'สร้างข่าวสารใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-800 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                  หัวข้อข่าวสาร *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สรุปผลการแข่งขันกีฬาสาธิตเกมส์ ครั้งที่ 12 (หรือวางลิงก์ YouTube เพื่อดึงชื่ออัตโนมัติ)"
                  className="w-full text-xs input-underline"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    หมวดหมู่ข่าว *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NewsCategory)}
                    className="w-full text-xs border border-stone-300 p-2 rounded-sm"
                  >
                    <option value="pr">ข่าวประชาสัมพันธ์</option>
                    <option value="activity">ภาพข่าวกิจกรรม</option>
                    <option value="regulation">ข้อบังคับ ระเบียบ คำสั่งและประกาศ</option>
                    <option value="knowledge">สาระน่ารู้</option>
                    <option value="video">คลิปวิดีโอ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    ลิงก์วิดีโอ / โพสต์หลัก (YouTube / Facebook / IG / TikTok)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="วางลิงก์ YouTube, Facebook, Instagram หรือ TikTok..."
                    className="w-full text-xs input-underline"
                  />
                </div>
              </div>

              {/* Automatic YouTube Preview Card when YouTube URL is detected */}
              {ytPreview && (
                <div className="p-4 bg-[#EDE6F5]/45 border border-[#4B1F7A]/25 rounded-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2A1245]">
                      <span className="px-2 py-0.5 rounded-sm bg-red-600 text-white text-[10px]">YouTube</span>
                      <span>ดึงข้อมูลวิดีโอจาก YouTube สำเร็จ (พร้อมแสดงบนหน้าเว็บและภาพปกอัตโนมัติ)</span>
                    </div>
                    {ytPreview.loading && (
                      <span className="text-[11px] text-[#4B1F7A]">กำลังโหลดข้อมูลคลิป...</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5">
                      <YouTubeLitePlayer url={ytPreview.url} title={ytPreview.title || title} />
                    </div>
                    <div className="sm:col-span-7 space-y-2 text-xs">
                      {ytPreview.title && (
                        <div>
                          <span className="text-[11px] text-[#9C7A2B] font-medium block">ชื่อคลิปจาก YouTube:</span>
                          <p className="font-serif font-semibold text-[#1B1226] text-sm leading-snug">
                            {ytPreview.title}
                          </p>
                        </div>
                      )}
                      {ytPreview.authorName && (
                        <p className="text-[11px] text-[#1B1226]/70">
                          ช่อง: <span className="font-medium text-[#4B1F7A]">{ytPreview.authorName}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ytPreview.title && title.trim() !== ytPreview.title && (
                          <button
                            type="button"
                            onClick={() => setTitle(ytPreview.title)}
                            className="px-2.5 py-1 bg-white border border-[#4B1F7A]/25 text-[#4B1F7A] hover:bg-[#4B1F7A] hover:text-white rounded-sm text-[11px] transition-colors"
                          >
                            ใช้ชื่อคลิปเป็นหัวข้อข่าว
                          </button>
                        )}
                        {ytPreview.thumbnailUrl && coverImage.url !== ytPreview.thumbnailUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCoverImage({
                                url: ytPreview.thumbnailUrl,
                                alt: ytPreview.title || title || 'ภาพปกวิดีโอ YouTube',
                              })
                            }
                            className="px-2.5 py-1 bg-white border border-[#B8923A] text-[#9C7A2B] hover:bg-[#B8923A] hover:text-white rounded-sm text-[11px] transition-colors"
                          >
                            ใช้ภาพปกจาก YouTube
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Platform Social Media Links */}
              <div className="p-4 bg-[#FAF7F0] border border-[#B8923A]/30 rounded-sm space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1245]">
                    ลิงก์สื่อโซเชียลมีเดียเพิ่มเติม (Facebook, Instagram, TikTok, YouTube)
                  </label>
                  <p className="text-[11px] text-[#1B1226]/60">
                    รองรับโพสต์ คลิปวิดีโอ และ Reels จากทุกแพลตฟอร์ม โดยไม่เกิดปัญหาบล็อกการเชื่อมต่อบนหน้าเว็บ
                  </p>
                </div>

                {socialLinks.length > 0 && (
                  <div className="space-y-2">
                    {socialLinks.map((sl, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white border border-[#4B1F7A]/15 rounded-sm text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 bg-[#EDE6F5] text-[#4B1F7A] rounded font-semibold text-[10px] shrink-0">
                            {PLATFORM_LABELS[sl.platform || detectSocialPlatform(sl.url)]}
                          </span>
                          <span className="truncate font-medium text-[#1B1226]">
                            {sl.label || sl.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSocialLink(idx)}
                          className="text-[#9B1C31] hover:underline shrink-0 text-[11px]"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="url"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="วางลิงก์ Facebook / Instagram / TikTok / YouTube..."
                    className="sm:col-span-7 text-xs input-underline bg-white px-2"
                  />
                  <input
                    type="text"
                    value={newSocialLabel}
                    onChange={(e) => setNewSocialLabel(e.target.value)}
                    placeholder="คำอธิบายลิงก์ (ไม่บังคับ)"
                    className="sm:col-span-3 text-xs input-underline bg-white px-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="sm:col-span-2 px-3 py-1.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs rounded-sm hover:bg-[#2A1245]"
                  >
                    + เพิ่มลิงก์
                  </button>
                </div>
              </div>

              {/* Cover Image Uploader */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                  ภาพปกข่าว (อัปโหลดจากเครื่อง หรือระบุลิงก์ — หากเป็น YouTube จะดึงภาพปกให้อัตโนมัติ)
                </label>
                <ImageUploader
                  value={coverImage}
                  onChange={(asset) => setCoverImage(asset)}
                  aspectRatioLabel="สัดส่วนแนะนำ 16:9 หรือ 3:2"
                  folder="news_covers"
                  maxDimension={1200}
                  maxSizeMB={0.22}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                  บทคัดย่อสั้น (Excerpt)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="ข้อความสรุป 1-2 บรรทัดสำหรับแสดงบนการ์ดข่าวหน้าแรก..."
                  className="w-full text-xs input-underline"
                />
              </div>

              {/* Tiptap Rich Text Content Editor */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                  เนื้อหาข่าวฉบับเต็ม (Rich Text Editor)
                </label>
                <div className="border border-stone-300 rounded-sm overflow-hidden bg-white">
                  <div className="bg-stone-100 border-b border-stone-200 p-2 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`px-2 py-0.5 rounded ${editor?.isActive('bold') ? 'bg-[#4B1F7A] text-white' : 'bg-white'}`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`px-2 py-0.5 rounded ${editor?.isActive('italic') ? 'bg-[#4B1F7A] text-white' : 'bg-white'}`}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-2 py-0.5 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-[#4B1F7A] text-white' : 'bg-white'}`}
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`px-2 py-0.5 rounded ${editor?.isActive('bulletList') ? 'bg-[#4B1F7A] text-white' : 'bg-white'}`}
                    >
                      • รายการ
                    </button>
                  </div>
                  <EditorContent editor={editor} className="p-4 min-h-[160px] text-xs leading-relaxed focus:outline-none" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="accent-[#4B1F7A]"
                  />
                  <span>เผยแพร่สู่สาธารณะทันที (Published)</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-[#2A1245]">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="accent-[#B8923A]"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    <PinIcon className="w-3.5 h-3.5 text-[#9C7A2B]" />
                    <span>ปักหมุดขึ้นหน้าแรก (แสดงด้านบนข่าวสารและความเคลื่อนไหว)</span>
                  </span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-xs rounded-sm hover:bg-stone-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลข่าวสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessFeedbackModal
        open={!!successModalTitle}
        title={successModalTitle}
        onClose={() => setSuccessModalTitle('')}
      />
    </div>
  );
};
