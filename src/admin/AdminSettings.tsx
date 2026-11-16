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
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { playAlert } from '../lib/alertSound';
import { usePendingComplaints } from './ComplaintAlertsContext';

const DEFAULT_HEADLINE = '"พวกเราพร้อมเป็นตัวแทนและรับฟังทุกเสียงของเพื่อนนักเรียนสาธิต มพ."';
const DEFAULT_MESSAGE =
  'องค์การนักเรียนยินดีต้อนรับนักเรียน ครู อาจารย์ และผู้ปกครองทุกท่าน เว็บไซต์นี้จัดทำขึ้นเพื่อเป็นช่องทางหลักในการสื่อสารความเคลื่อนไหว ประกาศระเบียบ กิจกรรม และที่สำคัญที่สุดคือเป็นช่องทางรับฟังความคิดเห็นและข้อเสนอแนะเพื่อร่วมสร้างสรรค์สังคมโรงเรียนของเราให้น่าอยู่และเปี่ยมด้วยคุณภาพ';

export const AdminSettings: React.FC = () => {
  const { refreshSettings } = useSiteSettings();
  const { soundEnabled, toggleSound } = usePendingComplaints();
  const [soundTestNote, setSoundTestNote] = useState<string | null>(null);

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inlineSavedNotice, setInlineSavedNotice] = useState<string | null>(null);
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

  const persistPartialSettings = async (patch: Record<string, unknown>, noticeText: string) => {
    setErrorMsg(null);
    try {
      await setDoc(doc(db, 'settings', 'site'), patch, { merge: true });
      await refreshSettings();
      setInlineSavedNotice(noticeText);
      setTimeout(() => setInlineSavedNotice(null), 3000);
    } catch (err) {
      console.error("Quick save settings failed:", err);
      setErrorMsg("ไม่สามารถบันทึกการเปลี่ยนแปลงได้ กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบ");
    }
  };

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTickerText.trim();
    if (!text) return;
    const nextList = [...tickerList, text];
    setTickerList(nextList);
    setNewTickerText('');
    await persistPartialSettings({ ticker: nextList }, 'บันทึกข้อความประกาศลงแถบข่าวด่วนบนหน้าเว็บแล้ว ✓');
  };

  const handleRemoveTicker = async (index: number) => {
    const nextList = tickerList.filter((_, i) => i !== index);
    setTickerList(nextList);
    await persistPartialSettings({ ticker: nextList }, 'อัปเดตแถบข้อความข่าวด่วนแล้ว ✓');
  };

  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      setErrorMsg("กรุณากรอกทั้งชื่อระบบและลิงก์ URL (https://...) ก่อนกดเพิ่มลิงก์");
      return;
    }
    const cleanUrl = newLinkUrl.trim();
    const nextLinks: ServiceLink[] = [
      ...links,
      {
        title: newLinkTitle.trim(),
        description: newLinkDesc.trim() || 'ลิงก์ระบบที่เกี่ยวข้อง',
        url: cleanUrl,
        external: cleanUrl.startsWith('http'),
      }
    ];
    setLinks(nextLinks);
    setNewLinkTitle('');
    setNewLinkDesc('');
    setNewLinkUrl('');
    await persistPartialSettings({ links: nextLinks }, 'บันทึกลิงก์ระบบที่เกี่ยวข้องลงส่วนท้ายเว็บไซต์แล้ว ✓');
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

  const handleRemoveLink = async (index: number) => {
    const nextLinks = links.filter((_, i) => i !== index);
    setLinks(nextLinks);
    await persistPartialSettings({ links: nextLinks }, 'อัปเดตลิงก์ระบบที่เกี่ยวข้องแล้ว ✓');
  };

  const handleSaveAll = async () => {
    setErrorMsg(null);
    const cleanYear = academicYearTH.trim();
    if (!/^\d{4}$/.test(cleanYear)) {
      setErrorMsg("กรุณาระบุปีการศึกษาเป็นตัวเลข พ.ศ. 4 หลัก เช่น 2569");
      return;
    }

    // Auto-include any pending typed items if user clicked Save All directly
    const finalTicker = newTickerText.trim()
      ? [...tickerList, newTickerText.trim()]
      : tickerList;
    if (newTickerText.trim()) {
      setTickerList(finalTicker);
      setNewTickerText('');
    }

    const finalLinks =
      newLinkTitle.trim() && newLinkUrl.trim()
        ? [
            ...links,
            {
              title: newLinkTitle.trim(),
              description: newLinkDesc.trim() || 'ลิงก์ระบบที่เกี่ยวข้อง',
              url: newLinkUrl.trim(),
              external: newLinkUrl.trim().startsWith('http'),
            },
          ]
        : links;
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      setLinks(finalLinks);
      setNewLinkTitle('');
      setNewLinkDesc('');
      setNewLinkUrl('');
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        academicYearTH: cleanYear,
        presidentHeadline: presidentHeadline.trim() || DEFAULT_HEADLINE,
        presidentMessage: presidentMessage.trim() || DEFAULT_MESSAGE,
        ticker: finalTicker,
        links: finalLinks,
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
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-text-muted">กำลังโหลดการตั้งค่าเว็บไซต์...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gold-border/20 pb-4">
        <h1 className="font-serif text-2xl font-semibold text-heading">
          ตั้งค่าเว็บไซต์ทั่วไป
        </h1>
        <p className="text-xs text-text-muted mt-1">
          ปีการศึกษาปัจจุบัน สารจากนายกองค์การนักเรียน ข้อความประกาศวิ่ง ลิงก์ระบบที่เกี่ยวข้อง และข้อมูลติดต่อ
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-error-bg border-l-2 border-error text-xs text-error">
          {errorMsg}
        </div>
      )}

      {inlineSavedNotice && (
        <div className="p-3 bg-success-bg border-l-2 border-success text-xs text-success font-medium">
          {inlineSavedNotice}
        </div>
      )}

      {/* Part 0: Global Academic Year */}
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-heading">
            ปีการศึกษาปัจจุบัน (พ.ศ.)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            ค่านี้จะอัปเดตอัตโนมัติทั่วทั้งเว็บไซต์ เช่น หน้าแรก ระบบรหัสติดตามเรื่องร้องเรียน (SC-{academicYearTH}-XXXXXX) คณะกรรมการ งบประมาณ และส่วนท้ายของเว็บ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-heading">ปีการศึกษา พ.ศ.:</label>
          <input
            type="text"
            value={academicYearTH}
            onChange={(e) => setAcademicYearTH(e.target.value)}
            maxLength={4}
            placeholder="2569"
            className="w-32 input-underline font-serif text-base font-bold text-accent"
          />
        </div>
      </div>

      {/* Part 1: Section 06 Message from the President */}
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-heading">
            06 สารจากนายกองค์การนักเรียน (หน้าแรก)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            ปรับแต่งหัวข้อคำคมและเนื้อหาสารจากนายกองค์การนักเรียนที่แสดงในส่วนที่ 06 ของหน้าแรก (รูปภาพและชื่อจะดึงจากบุคลากรตำแหน่ง "นายกองค์การนักเรียน" ล่าสุดให้อัตโนมัติ)
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-heading mb-1">
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
            <label className="block font-semibold text-heading mb-1">
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
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <h2 className="font-serif text-base font-semibold text-heading">
          แถบข้อความข่าวด่วนวิ่ง (Ticker Announcement Bar)
        </h2>
        <p className="text-xs text-text-muted">
          ข้อความเหล่านี้จะวิ่งอยู่ใต้เมนูหลักหน้าเว็บไซต์ เพื่อแจ้งข่าวเร่งด่วนแก่นักเรียน
        </p>

        <div className="space-y-2">
          {tickerList.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-surface border border-gold-border/20 rounded-sm text-xs">
              <span className="text-text font-medium">{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveTicker(idx)}
                className="text-error hover:underline text-xs ml-4"
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
            className="px-4 py-2 bg-brand text-brand-contrast text-xs rounded-sm hover:bg-brand-hover transition-colors"
          >
            + เพิ่มข้อความ
          </button>
        </form>
      </div>

      {/* Part 3: Related System Links */}
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-heading">
            ลิงก์ระบบที่เกี่ยวข้อง (Footer)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            แสดงในส่วนท้ายของเว็บไซต์ทุกหน้า (เช่น ระบบบริหารงานวิชาการ, ระบบบริหารงานกิจการนักเรียน, เพจ Facebook องค์การนักเรียน)
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {links.map((lk, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-surface border border-gold-border/20 rounded-sm items-center">
              <input
                type="text"
                value={lk.title}
                onChange={(e) => handleUpdateLink(idx, 'title', e.target.value)}
                placeholder="ชื่อระบบ"
                className="sm:col-span-4 input-underline bg-surface-elevated px-2"
              />
              <input
                type="url"
                value={lk.url}
                onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                placeholder="https://..."
                className="sm:col-span-7 input-underline bg-surface-elevated px-2 font-mono"
              />
              <button
                type="button"
                onClick={() => handleRemoveLink(idx)}
                className="sm:col-span-1 text-error hover:underline text-right"
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
            className="sm:col-span-2 px-3 py-2 bg-brand text-brand-contrast rounded-sm hover:bg-brand-hover transition-colors"
          >
            + เพิ่มลิงก์
          </button>
        </div>
      </div>

      {/* Part 4: Contact Information Override */}
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <h2 className="font-serif text-base font-semibold text-heading">
          ข้อมูลการติดต่อ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-heading mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-heading mb-1">อีเมลติดต่อ</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-heading mb-1">ที่อยู่โรงเรียน</label>
            <input
              type="text"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-heading mb-1">ชื่อเพจ Facebook</label>
            <input
              type="text"
              value={facebookName}
              onChange={(e) => setFacebookName(e.target.value)}
              className="w-full input-underline"
            />
          </div>

          <div>
            <label className="block font-semibold text-heading mb-1">ลิงก์เพจ Facebook</label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full input-underline"
            />
          </div>
        </div>
      </div>

      {/* Part 5: Admin Notification Sound */}
      <div className="bg-surface-elevated p-6 border border-gold-border/20 rounded-sm shadow-editorial-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-base font-semibold text-heading">
              เสียงแจ้งเตือนเรื่องร้องเรียน (ผู้ดูแลระบบ)
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              เล่นเสียงแจ้งเตือนอัตโนมัติบนอุปกรณ์นี้เมื่อเข้าสู่ระบบครั้งแรกที่มีเรื่องค้าง หรือเมื่อมีเรื่องร้องเรียนใหม่เข้ามาแบบเรียลไทม์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                toggleSound();
                setSoundTestNote(null);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-gold-border/30 bg-surface hover:bg-brand-soft text-heading text-xs font-medium rounded-sm transition-colors"
            >
              {soundEnabled ? (
                <SpeakerHigh size={16} weight="light" className="text-accent" />
              ) : (
                <SpeakerSlash size={16} weight="light" className="text-text-muted" />
              )}
              <span>{soundEnabled ? 'เสียงแจ้งเตือน: เปิดอยู่' : 'เสียงแจ้งเตือน: ปิดอยู่'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!soundEnabled) {
                  setSoundTestNote('เสียงแจ้งเตือนถูกปิดอยู่ กรุณากดเปิดเสียงก่อนทดสอบ');
                  return;
                }
                await playAlert({ urgent: false });
                setSoundTestNote('เล่นเสียงแจ้งเตือนทดสอบแล้ว');
                window.setTimeout(() => setSoundTestNote(null), 2500);
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-brand-contrast text-xs font-medium rounded-sm transition-colors"
            >
              ทดสอบเสียง
            </button>
          </div>
        </div>

        {soundTestNote && (
          <p className="text-xs text-accent font-medium">{soundTestNote}</p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-8 py-3 bg-brand text-brand-contrast text-xs font-medium rounded-sm hover:bg-brand-hover transition-colors shadow-editorial"
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
