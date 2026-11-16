/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonItem, PersonRole, AdvisorGroup, ImageAsset } from '../types';
import { ImageUploader } from '../components/common/ImageUploader';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { ADVISOR_GROUPS, getAdvisorGroupLabel, resolveAdvisorGroup } from '../config/site';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';
import { invalidatePublicDataCache } from '../lib/publicDataService';

export const AdminPeople: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<PersonRole>('board');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonItem | null>(null);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<PersonRole>('board');
  const [advisorGroup, setAdvisorGroup] = useState<AdvisorGroup>('teacher');
  const [position, setPosition] = useState('');
  const [grade, setGrade] = useState('');
  const [yearTH, setYearTH] = useState(academicYearTH);
  const [quote, setQuote] = useState('');
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
    setName('');
    setRole(selectedRole);
    setAdvisorGroup('teacher');
    setPosition(selectedRole === 'president' ? 'นายกองค์การนักเรียน' : '');
    setGrade('');
    setYearTH(academicYearTH);
    setQuote('');
    setOrder(people.filter(p => p.role === selectedRole).length + 1);
    setPhoto({ url: '', alt: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PersonItem) => {
    setEditingItem(item);
    setName(item.name);
    setRole(item.role);
    setAdvisorGroup(resolveAdvisorGroup(item));
    setPosition(item.position);
    setGrade(item.grade || '');
    setYearTH(item.yearTH || academicYearTH);
    setQuote(item.quote || '');
    setOrder(item.order || 1);
    setPhoto(item.photo || (item.photoUrl ? { url: item.photoUrl, alt: item.name } : { url: '', alt: '' }));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) return;

    setSaving(true);
    try {
      const id = editingItem?.id || doc(collection(db, 'people')).id;
      const now = new Date().toISOString();
      const personDoc: PersonItem = {
        name: name.trim(),
        role,
        ...(role === 'advisor' ? { advisorGroup } : {}),
        position: position.trim(),
        grade: grade.trim(),
        yearTH: yearTH.trim() || academicYearTH,
        quote: quote.trim(),
        order: Number(order) || 1,
        photo,
        photoUrl: photo.url,
        createdAt: editingItem?.createdAt || now,
        updatedAt: now
      };

      await setDoc(doc(db, 'people', id), personDoc);
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

  const handleDelete = async (id: string, personName: string) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบข้อมูล "${personName}" หรือไม่?`)) return;
    try {
      await deleteDoc(doc(db, 'people', id));
      invalidatePublicDataCache('people');
      await fetchPeople();
      setSuccessModalTitle('ลบข้อมูลบุคลากรเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Delete person failed:", err);
    }
  };

  const filteredPeople = people.filter(p => p.role === selectedRole);

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
            onClick={() => setSelectedRole(t.id as PersonRole)}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-gold-border/15 text-gold-text uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">รูปภาพ</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">ปีการศึกษา</th>
                  <th className="py-3 px-4">ชั้น/ห้อง</th>
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-border/10">
                {filteredPeople.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-alt/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="w-10 h-12 bg-bg-alt rounded-sm overflow-hidden border border-gold-border/20">
                        {item.photo?.url || item.photoUrl ? (
                          <img
                            src={item.photo?.url || item.photoUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-soft flex items-center justify-center text-[10px] text-accent">
                            สธ
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-text">
                      {item.name}
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
                    <td className="py-3 px-4 text-text-muted">
                      {item.grade || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-text">
                      {item.order}
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-text-muted">
            ยังไม่มีข้อมูลในหมวดหมู่นี้ กดปุ่ม "เพิ่มข้อมูลบุคคล" เพื่อเริ่มบันทึก
          </div>
        )}
      </div>

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
                    placeholder={academicYearTH}
                    className="w-full input-underline"
                    required
                  />
                </div>
              </div>

              {role === 'advisor' && (
                <div>
                  <label className="block font-semibold text-heading mb-1">
                    ฝ่ายในคณะกรรมการที่ปรึกษา *
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

              <div>
                <label className="block font-semibold text-heading mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นายธนภัทร สุขสมบูรณ์"
                  className="w-full input-underline"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-heading mb-1">ตำแหน่ง *</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น นายกองค์การนักเรียน, อุปนายกองค์การนักเรียน, ฝ่ายเลขานุการ, ฝ่ายกิจกรรมนักเรียน"
                    className="w-full input-underline"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">ระดับชั้น / ห้องเรียน</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="เช่น ม.6/1 (ถ้ามี)"
                    className="w-full input-underline"
                  />
                </div>
              </div>

              {/* Photo ImageUploader */}
              <div>
                <label className="block font-semibold text-heading mb-1">
                  รูปถ่ายบุคคล (อัปโหลดจากเครื่อง หรือระบุลิงก์)
                </label>
                <ImageUploader
                  value={photo}
                  onChange={(asset) => setPhoto(asset)}
                  aspectRatioLabel="สัดส่วนแนวตั้ง 4:5"
                  folder="people_photos"
                  maxDimension={800}
                />
              </div>

              <div>
                <label className="block font-semibold text-heading mb-1">
                  คติประจำใจ / สารประจำตัว (Quote — ใช้แสดงหน้าแรกหากเป็นนายกองค์การนักเรียน)
                </label>
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  rows={3}
                  placeholder="เช่น พวกเราพร้อมเป็นตัวแทนและรับฟังทุกเสียงของเพื่อนนักเรียนสาธิต มพ."
                  className="w-full input-underline"
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
