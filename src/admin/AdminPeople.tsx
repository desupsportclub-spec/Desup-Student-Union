/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonItem, PersonRole, AdvisorGroup, ImageAsset } from '../types';
import { ImageUploader } from '../components/common/ImageUploader';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { ADVISOR_GROUPS, getAdvisorGroupLabel, resolveAdvisorGroup } from '../config/site';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { invalidatePublicDataCache } from '../lib/publicDataService';
import { hasAnyEnTranslation } from '../lib/l10n';
import { AdminLangTabs, AdminEnStatusBadge, AdminLangMode } from './AdminLangTabs';

export const AdminPeople: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<PersonRole>('board');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonItem | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [reordering, setReordering] = useState(false);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ฟิลด์ข้อมูลฟอร์ม 2 ภาษา
  const [editLang, setEditLang] = useState<AdminLangMode>('th');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState<PersonRole>('board');
  const [advisorGroup, setAdvisorGroup] = useState<AdvisorGroup>('teacher');
  const [position, setPosition] = useState('');
  const [positionEn, setPositionEn] = useState('');
  const [yearTH, setYearTH] = useState(academicYearTH);
  const [order, setOrder] = useState(1);
  const [photo, setPhoto] = useState<ImageAsset>({ url: '', alt: '' });
  const [saving, setSaving] = useState(false);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'people'));
      const list: PersonItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as PersonItem);
      });
      list.sort((a, b) => (a.order || 999) - (b.order || 999));
      setPeople(list);
    } catch (err) {
      console.warn("Could not fetch people:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setEditLang('th');
    setName('');
    setNameEn('');
    setRole(selectedRole);
    setAdvisorGroup('executive');
    setPosition(selectedRole === 'president' ? 'นายกองค์การนักเรียน' : '');
    setPositionEn(selectedRole === 'president' ? 'Student Union President' : '');
    setYearTH(academicYearTH);
    setOrder(people.filter(p => p.role === selectedRole).length + 1);
    setPhoto({ url: '', alt: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PersonItem) => {
    setEditingItem(item);
    setEditLang('th');
    setName(item.name);
    setNameEn(item.nameEn || '');
    setRole(item.role);
    setAdvisorGroup(resolveAdvisorGroup(item));
    setPosition(item.position);
    setPositionEn(item.positionEn || '');
    setYearTH(item.yearTH || academicYearTH);
    setOrder(item.order || 1);
    setPhoto(item.photo || (item.photoUrl ? { url: item.photoUrl, alt: item.name } : { url: '', alt: '' }));
    setIsModalOpen(true);
  };

  const performSave = async () => {
    if (!name.trim() || !position.trim()) return;

    setSaving(true);
    try {
      const id = editingItem?.id || doc(collection(db, 'people')).id;
      const now = new Date().toISOString();
      const normalizedPhoto: ImageAsset = {
        url: photo.url,
        alt: name.trim(),
      };
      const personDoc: PersonItem = {
        name: name.trim(),
        nameEn: nameEn.trim(),
        role,
        ...(role === 'advisor' ? { advisorGroup } : {}),
        position: position.trim(),
        positionEn: positionEn.trim(),
        grade: '',
        gradeEn: '',
        yearTH: yearTH.trim() || academicYearTH,
        quote: '',
        quoteEn: '',
        order: Number(order) || 1,
        photo: normalizedPhoto,
        photoUrl: photo.url,
        createdAt: editingItem?.createdAt || now,
        updatedAt: now
      };

      await setDoc(doc(db, 'people', id), personDoc);

      // จัดเรียงลำดับในหมวดหมู่เดียวกันใหม่ให้ต่อเนื่องไม่ซ้ำกันเมื่อกำหนดลำดับจากหน้าต่างเพิ่ม/แก้ไข
      const savedItem: PersonItem = { ...personDoc, id };
      const sameRoleOthers = people
        .filter((p) => p.role === role && p.id !== id)
        .sort((a, b) => (a.order || 999) - (b.order || 999));
      const targetIndex = Math.max(0, Math.min(sameRoleOthers.length, (Number(order) || 1) - 1));
      sameRoleOthers.splice(targetIndex, 0, savedItem);

      const batch = writeBatch(db);
      let hasOrderShifts = false;
      sameRoleOthers.forEach((p, index) => {
        const expectedOrder = index + 1;
        if (p.id && p.order !== expectedOrder) {
          hasOrderShifts = true;
          batch.update(doc(db, 'people', p.id), {
            order: expectedOrder,
            updatedAt: now,
          });
        }
      });
      if (hasOrderShifts) {
        await batch.commit();
      }

      invalidatePublicDataCache('people');
      setIsModalOpen(false);
      await fetchPeople();
      setSuccessModalTitle(editingItem ? 'อัปเดตข้อมูลบุคลากรเรียบร้อยแล้ว' : 'เพิ่มข้อมูลบุคลากรเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save person failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) return;
    void performSave();
  };

  const performDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'people', id));
      invalidatePublicDataCache('people');
      setDeleteTarget(null);
      await fetchPeople();
      setSuccessModalTitle('ลบข้อมูลบุคลากรเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete person failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, personName: string) => {
    setDeleteTarget({ id, name: personName });
  };

  const filteredPeople = people.filter(p => p.role === selectedRole);

  const persistReorderedList = async (reorderedRoleList: PersonItem[]) => {
    const now = new Date().toISOString();
    const updatedRoleList = reorderedRoleList.map((item, index) => ({
      ...item,
      order: index + 1,
      updatedAt: now,
    }));

    const orderMap = new Map<string, PersonItem>();
    updatedRoleList.forEach((item) => {
      if (item.id) orderMap.set(item.id, item);
    });

    const previousPeople = people;
    const nextAll = people
      .map((item) => (item.id && orderMap.has(item.id) ? orderMap.get(item.id)! : item))
      .sort((a, b) => (a.order || 999) - (b.order || 999));
    setPeople(nextAll);

    setReordering(true);
    try {
      const batch = writeBatch(db);
      updatedRoleList.forEach((item) => {
        if (item.id) {
          batch.update(doc(db, 'people', item.id), {
            order: item.order,
            updatedAt: now,
          });
        }
      });
      await batch.commit();
      invalidatePublicDataCache('people');
      setOrderDrafts({});
    } catch (err) {
      console.error('Reorder people failed:', err);
      setPeople(previousPeople);
    } finally {
      setReordering(false);
    }
  };

  const computeReorderedList = (
    currentList: PersonItem[],
    drafts: Record<string, string>
  ): { nextList: PersonItem[]; changedCount: number; hasInvalidDraft: boolean } => {
    const unchanged: PersonItem[] = [];
    const changed: { item: PersonItem; targetOrder: number; originalIndex: number }[] = [];
    let hasInvalidDraft = false;

    currentList.forEach((item, index) => {
      const currentOrder = item.order || index + 1;
      const raw = item.id ? drafts[item.id] : undefined;
      if (raw === undefined) {
        unchanged.push(item);
        return;
      }
      if (raw.trim() === '') {
        hasInvalidDraft = true;
        unchanged.push(item);
        return;
      }
      const parsed = Math.floor(Number(raw));
      if (!Number.isFinite(parsed) || parsed < 1) {
        hasInvalidDraft = true;
        unchanged.push(item);
        return;
      }
      const clampedTarget = Math.max(1, Math.min(currentList.length, parsed));
      if (clampedTarget === currentOrder) {
        unchanged.push(item);
        return;
      }
      changed.push({ item, targetOrder: clampedTarget, originalIndex: index });
    });

    if (changed.length === 0) {
      return { nextList: currentList, changedCount: 0, hasInvalidDraft };
    }

    changed.sort((a, b) => a.targetOrder - b.targetOrder || a.originalIndex - b.originalIndex);
    const nextList = [...unchanged];
    changed.forEach(({ item, targetOrder }) => {
      const insertIdx = Math.max(0, Math.min(nextList.length, targetOrder - 1));
      nextList.splice(insertIdx, 0, item);
    });

    return { nextList, changedCount: changed.length, hasInvalidDraft };
  };

  const orderRecompute = computeReorderedList(filteredPeople, orderDrafts);
  const hasOrderDrafts = Object.keys(orderDrafts).length > 0;

  const handleCancelOrderDrafts = (targetId?: string) => {
    if (!targetId) {
      setOrderDrafts({});
      return;
    }
    setOrderDrafts((prev) => {
      if (!(targetId in prev)) return prev;
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  };

  const handleConfirmOrderDrafts = () => {
    if (reordering || orderRecompute.changedCount === 0) return;
    void persistReorderedList(orderRecompute.nextList);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-border/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">
            จัดการบุคลากรและทำเนียบ
          </h1>
          <p className="text-xs text-text-muted">
            คณะกรรมการองค์การนักเรียน คณะกรรมการที่ปรึกษา และทำเนียบนายกองค์การนักเรียน
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-sm hover:bg-brand-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          + เพิ่มข้อมูลบุคคล
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-6 border-b border-gold-border/15 text-xs font-medium pb-2">
        {[
          { id: 'board', label: 'คณะกรรมการองค์การนักเรียน' },
          { id: 'advisor', label: 'คณะกรรมการที่ปรึกษา' },
          { id: 'president', label: 'ทำเนียบนายกองค์การนักเรียน' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedRole(t.id as PersonRole);
              setOrderDrafts({});
            }}
            className={`pb-2 whitespace-nowrap transition-colors relative ${
              selectedRole === t.id
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-heading'
            }`}
          >
            <span>{t.label}</span>
            {selectedRole === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
            )}
          </button>
        ))}
      </div>

      {/* People Table */}
      <div className="bg-surface-elevated border border-gold-border/20 rounded-sm shadow-editorial-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-text-muted">กำลังโหลด...</div>
        ) : filteredPeople.length > 0 ? (
          <>
            <div className="px-4 py-2 bg-surface border-b border-gold-border/15 flex items-center justify-between text-[11px] text-text-muted">
              <span>พิมพ์แก้ตัวเลขลำดับ แล้วกดปุ่มยืนยันด้านล่างขวาเพื่อบันทึกลำดับใหม่</span>
              {reordering && <span className="text-gold-text font-medium">กำลังบันทึกลำดับ...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-gold-border/15 text-gold-text uppercase tracking-wider font-medium">
                  <tr>
                    <th className="py-3 px-4 w-24">ลำดับ</th>
                    <th className="py-3 px-4">รูปภาพ</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-4">ภาษา</th>
                    <th className="py-3 px-4">ตำแหน่ง</th>
                    <th className="py-3 px-4">ปีการศึกษา</th>
                    <th className="py-3 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-border/10">
                  {filteredPeople.map((item, idx) => {
                    const currentOrder = item.order || idx + 1;
                    const draftVal = item.id ? orderDrafts[item.id] : undefined;
                    const isRowDrafted = draftVal !== undefined;
                    const parsedDraft = isRowDrafted ? Math.floor(Number(draftVal)) : currentOrder;
                    const isRowValid =
                      !isRowDrafted ||
                      (draftVal.trim() !== '' && Number.isFinite(parsedDraft) && parsedDraft >= 1);
                    const isRowChanged =
                      isRowDrafted &&
                      isRowValid &&
                      Math.max(1, Math.min(filteredPeople.length, parsedDraft)) !== currentOrder;

                    return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-bg-alt/60"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={1}
                          max={filteredPeople.length}
                          disabled={reordering}
                          value={isRowDrafted ? draftVal : String(currentOrder)}
                          onChange={(e) => {
                            if (!item.id) return;
                            const val = e.target.value;
                            if (val === String(currentOrder)) {
                              handleCancelOrderDrafts(item.id);
                              return;
                            }
                            setOrderDrafts((prev) => ({ ...prev, [item.id!]: val }));
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleConfirmOrderDrafts();
                            } else if (e.key === 'Escape') {
                              handleCancelOrderDrafts(item.id);
                              e.currentTarget.blur();
                            }
                          }}
                          aria-label={`ลำดับของ ${item.name}`}
                          title="พิมพ์เลขลำดับใหม่ แล้วกดยืนยันด้านล่างขวา"
                          className={`w-14 px-1.5 py-1 text-center font-mono text-xs bg-surface rounded-sm text-heading focus:outline-none disabled:opacity-50 ${
                            !isRowValid
                              ? 'border-2 border-error'
                              : isRowChanged
                              ? 'border-2 border-gold'
                              : 'border border-gold-border/35 focus:border-gold'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="w-10 h-12 bg-bg-alt rounded-sm overflow-hidden border border-gold-border/20">
                          {(item.photo?.url || item.photoUrl) && (
                            <img
                              src={item.photo?.url || item.photoUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-text">
                        <div>{item.name}</div>
                        {item.nameEn && (
                          <div className="text-[10px] text-text-muted mt-0.5">EN: {item.nameEn}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <AdminEnStatusBadge
                          translated={hasAnyEnTranslation(item.nameEn, item.positionEn)}
                        />
                      </td>
                      <td className="py-3 px-4 text-accent font-medium">
                        <div>{item.position}</div>
                        {item.role === 'advisor' && (
                          <div className="text-[10px] text-gold-text font-normal mt-0.5">
                            {getAdvisorGroupLabel(resolveAdvisorGroup(item), true)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gold-text">
                        {item.yearTH}
                      </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-accent hover:underline"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.name)}
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
          </>
        ) : (
          <div className="p-12 text-center text-xs text-text-muted">
            ยังไม่มีข้อมูลในหมวดหมู่นี้ กดปุ่ม "เพิ่มข้อมูลบุคคล" เพื่อเริ่มบันทึก
          </div>
        )}
      </div>

      {/* Bottom-right action bar when order edits exist */}
      {hasOrderDrafts && (
        <div className="sticky bottom-4 z-30 flex justify-end">
          <div className="bg-surface-elevated border border-gold-border/40 rounded-sm shadow-editorial px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-text-muted">
              {orderRecompute.changedCount > 0
                ? `แก้ไขลำดับ ${orderRecompute.changedCount} รายการ`
                : 'กรุณาระบุเลขลำดับที่ถูกต้อง'}
            </span>
            <button
              type="button"
              disabled={reordering}
              onClick={() => handleCancelOrderDrafts()}
              className="px-4 py-1.5 border border-gold-border/35 bg-surface text-text rounded-sm hover:bg-bg-alt disabled:opacity-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={reordering || orderRecompute.changedCount === 0}
              onClick={handleConfirmOrderDrafts}
              className="px-5 py-1.5 bg-brand text-brand-contrast font-medium rounded-sm hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {reordering ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-elevated rounded-sm border border-gold-border/40 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-editorial my-8">
            <div className="flex items-center justify-between border-b border-gold-border/20 pb-3">
              <h2 className="font-serif text-lg font-semibold text-heading">
                {editingItem ? 'แก้ไขข้อมูลบุคคล' : 'เพิ่มข้อมูลบุคคลใหม่'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-heading">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-heading mb-1">หมวดหมู่ *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PersonRole)}
                    className="w-full border border-gold-border/30 bg-surface text-text p-2 rounded-sm focus:outline-none focus:border-gold"
                  >
                    <option value="board">คณะกรรมการ</option>
                    <option value="advisor">คณะกรรมการที่ปรึกษา</option>
                    <option value="president">ทำเนียบนายกองค์การนักเรียน</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">ปีการศึกษา (พ.ศ.) *</label>
                  <input
                    type="text"
                    value={yearTH}
                    onChange={(e) => setYearTH(e.target.value)}
                    className="w-full input-underline"
                    required
                  />
                </div>
              </div>

              {role === 'advisor' && (
                <div>
                  <label className="block font-semibold text-heading mb-1">
                    ฝ่าย *
                  </label>
                  <select
                    value={advisorGroup}
                    onChange={(e) => setAdvisorGroup(e.target.value as AdvisorGroup)}
                    className="w-full border border-gold-border/30 p-2 rounded-sm bg-surface text-text focus:outline-none focus:border-gold"
                  >
                    {ADVISOR_GROUPS.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <AdminLangTabs
                value={editLang}
                onChange={setEditLang}
                enReady={hasAnyEnTranslation(nameEn, positionEn)}
              />

              <div className={editLang === 'th' ? 'space-y-4' : 'hidden'}>
                <div>
                  <label className="block font-semibold text-heading mb-1">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full input-underline"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">ตำแหน่ง (ภาษาไทย) *</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full input-underline"
                    required
                  />
                </div>
              </div>

              <div className={editLang === 'en' ? 'space-y-4' : 'hidden'}>
                <div>
                  <label className="block font-semibold text-heading mb-1">Full Name (English — Optional)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full input-underline"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">Position / Title (English — Optional)</label>
                  <input
                    type="text"
                    value={positionEn}
                    onChange={(e) => setPositionEn(e.target.value)}
                    className="w-full input-underline"
                  />
                </div>
              </div>

              {/* อัปโหลดรูปถ่ายบุคคล (ใช้ร่วมกันทั้งสองภาษา) */}
              <div>
                <label className="block font-semibold text-heading mb-1">
                  รูปถ่ายบุคคล
                </label>
                <ImageUploader
                  value={photo}
                  onChange={(asset) => setPhoto(asset)}
                  aspectRatioLabel="สัดส่วนแนวตั้ง 4:5"
                  folder="people_photos"
                  maxDimension={800}
                  hideUrlTab
                  hideAltText
                />
              </div>

              <div>
                <label className="block font-semibold text-heading mb-1">ลำดับการแสดงผล</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  min={1}
                  className="w-24 input-underline font-mono"
                />
              </div>

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
                  {saving ? 'กำลังบันทึก...' : editingItem ? 'ยืนยัน' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-overlay-backdrop backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-gold-border/50 rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-heading">
              ยืนยันการลบข้อมูล
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              คุณแน่ใจว่าต้องการลบข้อมูล{' '}
              <span className="font-semibold text-heading">{deleteTarget.name}</span>{' '}
              หรือไม่? การลบไม่สามารถกู้คืนได้
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gold-border/20">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="px-4 py-2 border border-gold-border/30 bg-surface-elevated text-xs text-text rounded-sm hover:bg-bg-alt transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void performDelete(deleteTarget.id)}
                className="px-5 py-2 bg-error text-brand-contrast text-xs font-medium rounded-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {saving ? 'กำลังลบ...' : 'ยืนยัน'}
              </button>
            </div>
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
