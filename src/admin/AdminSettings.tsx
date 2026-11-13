/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ServiceLink } from '../types';
import { SITE_CONFIG, RELATED_SYSTEM_LINKS } from '../config/site';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';

const DEFAULT_HEADLINE = '"พวกเราพร้อมเป็นตัวแทนและรับฟังทุกเสียงของเพื่อนนักเรียนสาธิต มพ."';
const DEFAULT_MESSAGE =
  'องค์การนักเรียนยินดีต้อนรับนักเรียน ครู อาจารย์ และผู้ปกครองทุกท่าน เว็บไซต์นี้จัดทำขึ้นเพื่อเป็นช่องทางหลักในการสื่อสารความเคลื่อนไหว ประกาศระเบียบ กิจกรรม และที่สำคัญที่สุดคือเป็นช่องทางรับฟังความคิดเห็นและข้อเสนอแนะเพื่อร่วมสร้างสรรค์สังคมโรงเรียนของเราให้น่าอยู่และเปี่ยมด้วยคุณภาพ';

export const AdminSettings: React.FC = () => {
  const { refreshSettings } = useSiteSettings();

  const [academicYearTH, setAcademicYearTH] = useState(SITE_CONFIG.currentAcademicYearTH);
  const [presidentHeadline, setPresidentHeadline] = useState(DEFAULT_HEADLINE);
  const [presidentMessage, setPresidentMessage] = useState(DEFAULT_MESSAGE);

  const [tickerList, setTickerList] = useState<string[]>([]);
  const [newTickerText, setNewTickerText] = useState('');

  const [contactPhone, setContactPhone] = useState(SITE_CONFIG.contact.phone);
  const [contactEmail, setContactEmail] = useState(SITE_CONFIG.contact.email);
  const [contactAddress, setContactAddress] = useState(SITE_CONFIG.contact.address);
  const [facebookName, setFacebookName] = useState(SITE_CONFIG.contact.facebook);
  const [facebookUrl, setFacebookUrl] = useState(SITE_CONFIG.contact.facebookUrl);

  const [links, setLinks] = useState<ServiceLink[]>(RELATED_SYSTEM_LINKS);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.academicYearTH) setAcademicYearTH(String(data.academicYearTH));
          if (data.presidentHeadline) setPresidentHeadline(String(data.presidentHeadline));
          if (data.presidentMessage) setPresidentMessage(String(data.presidentMessage));
          if (data.ticker && Array.isArray(data.ticker)) setTickerList(data.ticker);
          if (data.links && Array.isArray(data.links) && data.links.length > 0) setLinks(data.links);
          if (data.contactInfo) {
            if (data.contactInfo.phone) {
              setContactPhone(
                data.contactInfo.phone === '054-466-666 ต่อ 1450-1452'
                  ? SITE_CONFIG.contact.phone
                  : data.contactInfo.phone
              );
            }
            if (data.contactInfo.email) {
              setContactEmail(
                String(data.contactInfo.email).toLowerCase() === 'desup.council@up.ac.th'
                  ? SITE_CONFIG.contact.email
                  : data.contactInfo.email
              );
            }
            if (data.contactInfo.address) setContactAddress(data.contactInfo.address);
            if (data.contactInfo.facebook) setFacebookName(data.contactInfo.facebook);
            if (data.contactInfo.facebookUrl) setFacebookUrl(data.contactInfo.facebookUrl);
          }
        } else {
          setTickerList([
            "ยินดีต้อนรับสู่เว็บไซต์ทางการ องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
            "ร่วมส่งเสียงและข้อเสนอแนะเพื่อพัฒนาโรงเรียนของเราผ่านระบบรับเรื่องร้องเรียนออนไลน์"
          ]);
        }
      } catch (err) {
        console.warn("Could not load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerText.trim()) return;
    setTickerList(prev => [...prev, newTickerText.trim()]);
    setNewTickerText('');
  };

  const handleRemoveTicker = (index: number) => {
    setTickerList(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    setLinks(prev => [
      ...prev,
      {
        title: newLinkTitle.trim(),
        description: newLinkDesc.trim() || 'ลิงก์ระบบที่เกี่ยวข้อง',
        url: newLinkUrl.trim(),
        external: newLinkUrl.trim().startsWith('http'),
      }
    ]);
    setNewLinkTitle('');
    setNewLinkDesc('');
    setNewLinkUrl('');
  };

  const handleUpdateLink = (index: number, field: keyof ServiceLink, value: string) => {
    setLinks(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        external: field === 'url' ? value.startsWith('http') : next[index].external,
      };
      return next;
    });
  };

  const handleRemoveLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const cleanYear = academicYearTH.trim();
    if (!/^\d{4}$/.test(cleanYear)) {
      alert("กรุณาระบุปีการศึกษาเป็นตัวเลข พ.ศ. 4 หลัก เช่น 2569");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        academicYearTH: cleanYear,
        presidentHeadline: presidentHeadline.trim() || DEFAULT_HEADLINE,
        presidentMessage: presidentMessage.trim() || DEFAULT_MESSAGE,
        ticker: tickerList,
        links,
        contactInfo: {
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          address: contactAddress.trim(),
          facebook: facebookName.trim(),
          facebookUrl: facebookUrl.trim(),
          mapIframeUrl: SITE_CONFIG.contact.mapIframeUrl,
        }
      }, { merge: true });

      await refreshSettings();
      setSuccessModalTitle('บันทึกการตั้งค่าเว็บไซต์ทั้งหมดเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Save settings failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500">กำลังโหลดการตั้งค่าเว็บไซต์...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#4B1F7A]/15 pb-4">
        <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
          ตั้งค่าเว็บไซต์ทั่วไป
        </h1>
        <p className="text-xs text-[#1B1226]/60 mt-1">
          ปีการศึกษาปัจจุบัน สารจากนายกองค์การนักเรียน ข้อความประกาศวิ่ง ลิงก์ระบบที่เกี่ยวข้อง และข้อมูลติดต่อ
        </p>
      </div>

      {/* Part 0: Global Academic Year */}
      <div className="bg-white p-6 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#2A1245]">
            ปีการศึกษาปัจจุบัน (พ.ศ.)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ค่านี้จะอัปเดตอัตโนมัติทั่วทั้งเว็บไซต์ เช่น หน้าแรก ระบบรหัสติดตามเรื่องร้องเรียน (SC-{academicYearTH}-XXXXXX) คณะกรรมการ งบประมาณ และส่วนท้ายของเว็บ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#2A1245]">ปีการศึกษา พ.ศ.:</label>
          <input
            type="text"
            value={academicYearTH}
            onChange={(e) => setAcademicYearTH(e.target.value)}
            maxLength={4}
            placeholder="2569"
            className="w-32 input-underline font-serif text-base font-bold text-[#4B1F7A]"
          />
        </div>
      </div>

      {/* Part 1: Section 06 Message from the President */}
      <div className="bg-white p-6 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#2A1245]">
            06 สารจากนายกองค์การนักเรียน (หน้าแรก)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ปรับแต่งหัวข้อคำคมและเนื้อหาสารจากนายกองค์การนักเรียนที่แสดงในส่วนที่ 06 ของหน้าแรก (รูปภาพและชื่อจะดึงจากบุคลากรตำแหน่ง "นายกองค์การนักเรียน" ล่าสุดให้อัตโนมัติ)
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">
              หัวข้อคำคม / ประโยคเด่น (Headline Quote)
            </label>
            <input
              type="text"
              value={presidentHeadline}
              onChange={(e) => setPresidentHeadline(e.target.value)}
              placeholder={DEFAULT_HEADLINE}
              className="w-full input-underline text-sm font-serif"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">
              เนื้อหาสารจากนายกองค์การนักเรียน
            </label>
            <textarea
              value={presidentMessage}
              onChange={(e) => setPresidentMessage(e.target.value)}
              rows={4}
              placeholder={DEFAULT_MESSAGE}
              className="w-full input-underline leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Ticker Announcements */}
      <div className="bg-white p-6 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <h2 className="font-serif text-base font-semibold text-[#2A1245]">
          แถบข้อความข่าวด่วนวิ่ง (Ticker Announcement Bar)
        </h2>
        <p className="text-xs text-stone-500">
          ข้อความเหล่านี้จะวิ่งอยู่ใต้เมนูหลักหน้าเว็บไซต์ เพื่อแจ้งข่าวเร่งด่วนแก่นักเรียน
        </p>

        <div className="space-y-2">
          {tickerList.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FAF7F0] border border-stone-200 rounded-sm text-xs">
              <span className="text-[#1B1226] font-medium">{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveTicker(idx)}
                className="text-red-700 hover:text-red-900 text-xs ml-4"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTicker} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newTickerText}
            onChange={(e) => setNewTickerText(e.target.value)}
            placeholder="พิมพ์ข้อความประกาศใหม่..."
            className="flex-1 text-xs input-underline"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#4B1F7A] text-[#FAF7F0] text-xs rounded-sm hover:bg-[#2A1245]"
          >
            + เพิ่มข้อความ
          </button>
        </form>
      </div>

      {/* Part 3: Related System Links */}
      <div className="bg-white p-6 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#2A1245]">
            ลิงก์ระบบที่เกี่ยวข้อง (Footer)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            แสดงในส่วนท้ายของเว็บไซต์ทุกหน้า (เช่น ระบบบริหารงานวิชาการ, ระบบบริหารงานกิจการนักเรียน, เพจ Facebook องค์การนักเรียน)
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {links.map((lk, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-[#FAF7F0] border border-stone-200 rounded-sm items-center">
              <input
                type="text"
                value={lk.title}
                onChange={(e) => handleUpdateLink(idx, 'title', e.target.value)}
                placeholder="ชื่อระบบ"
                className="sm:col-span-4 input-underline bg-white px-2"
              />
              <input
                type="url"
                value={lk.url}
                onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                placeholder="https://..."
                className="sm:col-span-7 input-underline bg-white px-2 font-mono"
              />
              <button
                type="button"
                onClick={() => handleRemoveLink(idx)}
                className="sm:col-span-1 text-red-700 hover:underline text-right"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 text-xs">
          <input
            type="text"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            placeholder="ชื่อระบบที่เกี่ยวข้องใหม่..."
            className="sm:col-span-4 input-underline"
          />
          <input
            type="text"
            value={newLinkDesc}
            onChange={(e) => setNewLinkDesc(e.target.value)}
            placeholder="คำอธิบายสั้น (ไม่บังคับ)"
            className="sm:col-span-3 input-underline"
          />
          <input
            type="url"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder="https://..."
            className="sm:col-span-3 input-underline font-mono"
          />
          <button
            type="button"
            onClick={handleAddLink}
            className="sm:col-span-2 px-3 py-2 bg-[#4B1F7A] text-[#FAF7F0] rounded-sm hover:bg-[#2A1245]"
          >
            + เพิ่มลิงก์
          </button>
        </div>
      </div>

      {/* Part 4: Contact Information Override */}
      <div className="bg-white p-6 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <h2 className="font-serif text-base font-semibold text-[#2A1245]">
          ข้อมูลการติดต่อ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">อีเมลติดต่อ</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#2A1245] mb-1">ที่อยู่โรงเรียน</label>
            <input
              type="text"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">ชื่อเพจ Facebook</label>
            <input
              type="text"
              value={facebookName}
              onChange={(e) => setFacebookName(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2A1245] mb-1">ลิงก์เพจ Facebook</label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full input-underline"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-8 py-3 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors shadow-editorial"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
        </button>
      </div>

      <SuccessFeedbackModal
        open={!!successModalTitle}
        title={successModalTitle}
        onClose={() => setSuccessModalTitle('')}
      />
    </div>
  );
};
