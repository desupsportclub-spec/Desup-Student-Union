/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BannerItem, ImageAsset } from '../types';
import { ImageUploader } from '../components/common/ImageUploader';
import { CornerBracket } from '../components/common/Ornament';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { invalidatePublicDataCache } from '../lib/publicDataService';
import { hasAnyEnTranslation } from '../lib/l10n';
import { AdminLangTabs, AdminEnStatusBadge, AdminLangMode } from './AdminLangTabs';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null);

  // ฟิลด์ข้อมูลฟอร์ม 2 ภาษา
  const [editLang, setEditLang] = useState<AdminLangMode>('th');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list: BannerItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as BannerItem);
      });
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(list);
    } catch (err) {
      console.warn("Could not fetch banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setEditLang('th');
    setTitle('');
    setTitleEn('');
    setSubtitle('');
    setSubtitleEn('');
    setImageUrl('');
    setLinkUrl('');
    setOrder(banners.length + 1);
    setActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BannerItem) => {
    setEditingItem(item);
    setEditLang('th');
    setTitle(item.title);
    setTitleEn(item.titleEn || '');
    setSubtitle(item.subtitle || '');
    setSubtitleEn(item.subtitleEn || '');
    setImageUrl(item.imageUrl);
    setLinkUrl(item.linkUrl || '');
    setOrder(item.order || 1);
    setActive(item.active !== false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!imageUrl.trim()) {
      setErrorMsg("กรุณาอัปโหลดรูปภาพแบนเนอร์หรือระบุลิงก์รูปภาพ");
      return;
    }

    if (imageUrl.length > 900000) {
      setErrorMsg("ขนาดข้อมูลรูปภาพใหญ่เกินกว่าที่ฐานข้อมูลรองรับ กรุณาเลือกรูปที่ขนาดเล็กลงหรือระบุเป็นลิงก์รูปภาพ");
      return;
    }

    setSaving(true);
    try {
      const id = editingItem?.id || doc(collection(db, 'banners')).id;
      const bannerDoc: BannerItem = {
        title: title.trim(),
        titleEn: titleEn.trim(),
        subtitle: subtitle.trim(),
        subtitleEn: subtitleEn.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        order: Number(order) || 1,
        active,
        createdAt: editingItem?.createdAt || new Date().toISOString()
      };

      await setDoc(doc(db, 'banners', id), bannerDoc);
      invalidatePublicDataCache('banners');
      setIsModalOpen(false);
      await fetchBanners();
      setSuccessModalTitle(editingItem ? 'บันทึกการแก้ไขแบนเนอร์เรียบร้อยแล้ว' : 'เพิ่มแบนเนอร์ใหม่เรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save banner error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบหรือลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("คุณแน่ใจว่าต้องการลบแบนเนอร์นี้?")) return;

    try {
      await deleteDoc(doc(db, 'banners', id));
      invalidatePublicDataCache('banners');
      await fetchBanners();
      setSuccessModalTitle('ลบแบนเนอร์เรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleToggleActive = async (item: BannerItem) => {
    if (!item.id) return;
    try {
      await setDoc(doc(db, 'banners', item.id), {
        ...item,
        active: !item.active
      });
      invalidatePublicDataCache('banners');
      await fetchBanners();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-border/20">
        <div>
          <h1 className="font-serif text-2xl font-bold text-heading">
            จัดการแบนเนอร์หน้าแรก
          </h1>
          <p className="text-xs text-text-muted mt-1">
            เพิ่ม แก้ไข และจัดลำดับแบนเนอร์ภาพ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="text-xs px-4 py-2 bg-brand text-brand-contrast font-medium hover:bg-brand-hover rounded-sm shadow-editorial transition-all"
          >
            + เพิ่มแบนเนอร์ใหม่
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gold-text">กำลังโหลดข้อมูลแบนเนอร์...</div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gold-border/30 bg-surface-elevated rounded-sm space-y-4">
          <p className="font-serif text-lg text-heading">ยังไม่มีแบนเนอร์ในระบบ</p>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            กดปุ่ม "+ เพิ่มแบนเนอร์ใหม่" เพื่ออัปโหลดรูปภาพแบนเนอร์สำหรับแสดงบนหน้าแรกของเว็บไซต์
          </p>
          <button
            onClick={handleOpenCreate}
            className="text-xs px-5 py-2.5 bg-brand text-brand-contrast rounded-sm hover:bg-brand-hover transition-colors"
          >
            + เพิ่มแบนเนอร์ใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((item) => (
            <div
              key={item.id}
              className={`border bg-surface-elevated rounded-sm overflow-hidden shadow-editorial transition-all flex flex-col justify-between ${
                item.active ? 'border-gold-border/25' : 'border-gold-border/15 opacity-60'
              }`}
            >
              <div>
                <div className="aspect-[21/9] bg-bg-alt relative overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-anchor-bg/90 text-anchor-text rounded font-medium">
                      ลำดับ {item.order}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        item.active ? 'bg-success text-anchor-text' : 'bg-bg-alt text-text-muted border border-gold-border/20'
                      }`}
                    >
                      {item.active ? 'แสดงผล' : 'ซ่อน'}
                    </span>
                    <AdminEnStatusBadge
                      translated={hasAnyEnTranslation(item.titleEn, item.subtitleEn)}
                    />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-serif text-base font-semibold text-heading line-clamp-2">
                    {item.title}
                  </h3>
                  {item.titleEn && (
                    <p className="text-[11px] text-text-muted line-clamp-1">
                      EN: {item.titleEn}
                    </p>
                  )}
                  {item.subtitle && (
                    <p className="text-xs text-text-muted line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}
                  {item.linkUrl && (
                    <div className="text-[11px] text-gold-text truncate">
                      🔗 ลิงก์: {item.linkUrl}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-surface border-t border-gold-border/15 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    item.active
                      ? 'text-warning hover:bg-warning-bg'
                      : 'text-success hover:bg-success-bg'
                  }`}
                >
                  {item.active ? 'ซ่อนจากหน้าเว็บ' : 'เปิดแสดงผล'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1 bg-bg-alt hover:bg-brand-soft text-text rounded text-xs transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 bg-error-bg hover:bg-error/15 text-error rounded text-xs transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-backdrop backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-gold-border/50 w-full max-w-2xl rounded-sm p-6 md:p-8 shadow-2xl relative my-8">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <div className="flex items-center justify-between pb-4 border-b border-gold-border/20 mb-6">
              <h2 className="font-serif text-xl font-bold text-heading">
                {editingItem ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-heading text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-error-bg border-l-2 border-error text-xs text-error">
                  {errorMsg}
                </div>
              )}

              <AdminLangTabs
                value={editLang}
                onChange={setEditLang}
                enReady={hasAnyEnTranslation(titleEn, subtitleEn)}
              />

              <div className={editLang === 'th' ? 'space-y-4' : 'hidden'}>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    หัวข้อ / ข้อความหลักบนแบนเนอร์ — ภาษาไทย (ปล่อยว่างได้หากไม่ต้องการข้อความทับภาพ)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs input-underline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    ข้อความรอง / คำบรรยาย — ภาษาไทย (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full text-xs input-underline"
                  />
                </div>
              </div>

              <div className={editLang === 'en' ? 'space-y-4' : 'hidden'}>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    Banner Headline — English (Optional)
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full text-xs input-underline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    Banner Subtitle — English (Optional)
                  </label>
                  <input
                    type="text"
                    value={subtitleEn}
                    onChange={(e) => setSubtitleEn(e.target.value)}
                    className="w-full text-xs input-underline"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-heading mb-2">
                  รูปภาพแบนเนอร์ (สัดส่วนแนวกว้าง 21:9 หรือ 16:9 แนะนำขนาดกว้าง 1600px ขึ้นไป) *
                </label>
                <ImageUploader
                  value={imageUrl}
                  onChange={(asset: ImageAsset) => setImageUrl(asset.url)}
                  aspectRatioLabel="สัดส่วนแนวกว้าง 21:9 หรือ 16:9"
                  folder="banners"
                  maxDimension={1920}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    ลิงก์เมื่อคลิกแบนเนอร์ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full text-xs input-underline"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1">
                    ลำดับการแสดงผล (เรียงจากน้อยไปมาก)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full text-xs input-underline"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-accent rounded"
                />
                <label htmlFor="activeToggle" className="text-xs text-text font-medium cursor-pointer">
                  เปิดให้แสดงผลบนหน้าหลักทันที
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gold-border/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gold-border/30 text-xs text-text hover:bg-bg-alt rounded-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand text-brand-contrast text-xs font-medium hover:bg-brand-hover rounded-sm shadow-editorial transition-colors"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกแบนเนอร์'}
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
