/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EventItem } from '../types';
import {
  formatThaiDate,
  getEventDateKey,
  getEventScheduleStatus,
  getLocalTodayDateKey,
} from '../lib/format';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { invalidatePublicDataCache } from '../lib/publicDataService';
import { hasAnyEnTranslation } from '../lib/l10n';
import { AdminLangTabs, AdminEnStatusBadge, AdminLangMode } from './AdminLangTabs';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  // ฟิลด์ข้อมูลฟอร์ม 2 ภาษา
  const [editLang, setEditLang] = useState<AdminLangMode>('th');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [location, setLocation] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'events'));
      const list: EventItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as EventItem);
      });
      list.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''));
      setEvents(list);
    } catch (err) {
      console.warn("Could not fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setEditLang('th');
    setTitle('');
    setTitleEn('');
    setDescription('');
    setDescriptionEn('');
    setLocation('โรงเรียนสาธิต มพ.');
    setLocationEn('DeSUP Campus');
    setStartDate(getLocalTodayDateKey());
    setEndDate('');
    setPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditingItem(item);
    setEditLang('th');
    setTitle(item.title);
    setTitleEn(item.titleEn || '');
    setDescription(item.description || '');
    setDescriptionEn(item.descriptionEn || '');
    setLocation(item.location || '');
    setLocationEn(item.locationEn || '');
    setStartDate(getEventDateKey(item.startAt));
    setEndDate(item.endAt ? getEventDateKey(item.endAt) : '');
    setPublished(item.published);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setSaving(true);
    try {
      const id = editingItem?.id || doc(collection(db, 'events')).id;
      const hasValidEnd = Boolean(endDate && endDate > startDate);
      const eventDoc: EventItem = {
        title: title.trim(),
        titleEn: titleEn.trim(),
        description: description.trim(),
        descriptionEn: descriptionEn.trim(),
        type: editingItem?.type || 'academic',
        location: location.trim(),
        locationEn: locationEn.trim(),
        startAt: new Date(startDate).toISOString(),
        ...(hasValidEnd ? { endAt: new Date(endDate).toISOString() } : {}),
        allDay: true,
        published
      };

      await setDoc(doc(db, 'events', id), eventDoc);
      invalidatePublicDataCache('events');
      setIsModalOpen(false);
      await fetchEvents();
      setSuccessModalTitle(editingItem ? 'แก้ไขกิจกรรมเรียบร้อยแล้ว' : 'เพิ่มกิจกรรมใหม่เรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save event failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, eventTitle: string) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบกิจกรรม "${eventTitle}" หรือไม่?`)) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      invalidatePublicDataCache('events');
      await fetchEvents();
      setSuccessModalTitle('ลบกิจกรรมเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete event failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-border/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">
            จัดการปฏิทินกิจกรรม
          </h1>
          <p className="text-xs text-text-muted">
            กำหนดการกิจกรรมนักเรียน
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-sm hover:bg-brand-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          + เพิ่มกิจกรรมใหม่
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-surface-elevated border border-gold-border/20 rounded-sm shadow-editorial-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-text-muted">กำลังโหลดกิจกรรม...</div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-gold-border/15 text-gold-text uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">ชื่อกิจกรรม</th>
                  <th className="py-3 px-4">ภาษา</th>
                  <th className="py-3 px-4">สถานที่</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-border/10">
                {events.map((item) => {
                  const scheduleStatus = getEventScheduleStatus(item.startAt, item.endAt);
                  const hasEnd = Boolean(item.endAt && getEventDateKey(item.endAt) > getEventDateKey(item.startAt));
                  const hasEn = hasAnyEnTranslation(item.titleEn, item.descriptionEn, item.locationEn);
                  return (
                  <tr key={item.id} className="hover:bg-bg-alt/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-accent whitespace-nowrap">
                      <div>{formatThaiDate(item.startAt, true)}</div>
                      {hasEnd && item.endAt && (
                        <div className="text-[10px] font-normal text-gold-text">
                          ถึง {formatThaiDate(item.endAt, true)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-text">
                      <div>{item.title}</div>
                      {item.titleEn && (
                        <div className="text-[10px] text-text-muted mt-0.5">EN: {item.titleEn}</div>
                      )}
                      <div className="mt-1">
                        {scheduleStatus === 'ongoing' ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] rounded-sm bg-success-bg text-success border border-success/30">
                            อยู่ในช่วงจัดกิจกรรม
                          </span>
                        ) : scheduleStatus === 'upcoming' ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] rounded-sm bg-brand-soft text-accent">
                            ยังไม่จัด
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] rounded-sm bg-bg-alt text-text-muted">
                            ผ่านไปแล้ว (ซ่อนจากหน้าแรก)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <AdminEnStatusBadge translated={hasEn} />
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {item.location}
                    </td>
                    <td className="py-3 px-4">
                      {item.published ? (
                        <span className="text-success font-medium">แสดงบนปฏิทิน</span>
                      ) : (
                        <span className="text-text-muted">ซ่อนไว้</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-accent hover:underline"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.title)}
                        className="text-error hover:underline"
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
          <div className="p-12 text-center text-xs text-text-muted">
            ยังไม่มีกิจกรรมในระบบ กดปุ่ม "เพิ่มกิจกรรมใหม่" เพื่อเริ่มกำหนดตาราง
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated rounded-sm border border-gold-border/40 max-w-lg w-full p-6 space-y-5 shadow-editorial">
            <div className="flex items-center justify-between border-b border-gold-border/20 pb-3">
              <h2 className="font-serif text-lg font-semibold text-heading">
                {editingItem ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-heading">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <AdminLangTabs
                value={editLang}
                onChange={setEditLang}
                enReady={hasAnyEnTranslation(titleEn, descriptionEn, locationEn)}
              />

              <div className={editLang === 'th' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">ชื่อกิจกรรม (ภาษาไทย) *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full input-underline"
                  required
                />
              </div>

              <div className={editLang === 'en' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">Activity Title (English — Optional)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full input-underline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-heading mb-1">วันที่เริ่มจัดกิจกรรม *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDate(val);
                      if (endDate && val > endDate) setEndDate('');
                    }}
                    className="w-full border border-gold-border/30 bg-surface text-text p-2 rounded-sm focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">วันที่สิ้นสุด (ถ้าจัดหลายวัน)</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gold-border/30 bg-surface text-text p-2 rounded-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className={editLang === 'th' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">สถานที่จัดกิจกรรม (ภาษาไทย)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full input-underline"
                />
              </div>

              <div className={editLang === 'en' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">Location (English — Optional)</label>
                <input
                  type="text"
                  value={locationEn}
                  onChange={(e) => setLocationEn(e.target.value)}
                  className="w-full input-underline"
                />
              </div>

              <div className={editLang === 'th' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">คำอธิบายรายละเอียด (ภาษาไทย)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full input-underline"
                />
              </div>

              <div className={editLang === 'en' ? 'block' : 'hidden'}>
                <label className="block font-semibold text-heading mb-1">Description (English — Optional)</label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                  className="w-full input-underline"
                />
              </div>

              <label className="flex items-center gap-2 text-text cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="accent-accent"
                />
                <span>แสดงบนปฏิทินสาธารณะ</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gold-border/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gold-border/30 text-text rounded-sm hover:bg-bg-alt transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand text-brand-contrast rounded-sm hover:bg-brand-hover transition-colors"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
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
