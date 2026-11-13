/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { ComplaintType, ImageAsset } from '../types';
import { generateTrackingCode } from '../lib/format';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { compressImageFile, fileToDataUrl, getImageDimensions } from '../lib/imageService';
import { Link } from 'react-router-dom';
import { SuccessCheck } from '../components/SuccessCheck';
import { useSiteSettings } from '../context/SiteSettingsContext';

const COMPLAINT_TYPES: { id: ComplaintType; title: string; desc: string }[] = [
  { id: 'complaint', title: 'เรื่องร้องเรียนทั่วไป', desc: 'ปัญหาด้านสิ่งอำนวยความสะดวก อาคารสถานที่ หรือความไม่สะดวกในโรงเรียน' },
  { id: 'suggestion', title: 'ข้อเสนอแนะพัฒนาโรงเรียน', desc: 'แนวคิด กิจกรรมใหม่ ๆ หรือข้อเสนอเพื่อสร้างสรรค์โรงเรียนสาธิต มพ. ให้น่าอยู่' },
  { id: 'corruption', title: 'เบาะแสทุจริต / ความโปร่งใส', desc: 'รายงานความไม่โปร่งใส การประพฤติมิชอบ หรือการใช้อำนาจไม่เหมาะสม' },
  { id: 'inquiry', title: 'ติดต่อสอบถามข้อมูล', desc: 'สอบถามเกี่ยวกับกิจกรรม ระเบียบ หรือการดำเนินงานขององค์การนักเรียน' },
  { id: 'compliment', title: 'เรื่องชมเชยการทำงาน', desc: 'ส่งกำลังใจหรือคำชื่นชมการปฏิบัติหน้าที่ของเพื่อนนักเรียนและคณะทำงาน' },
  { id: 'other', title: 'อื่น ๆ', desc: 'เรื่องอื่น ๆ ที่ประสงค์จะสื่อสารกับองค์การนักเรียน' },
];

export const Complaint: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<ComplaintType>('complaint');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [anonymous, setAnonymous] = useState(true);

  // Contact Info (if not anonymous)
  const [contactName, setContactName] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);

  // Honeypot field for spam bots
  const [honeypot, setHoneypot] = useState('');

  // Attached images (max 2, compressed client-side to webp)
  const [attachedImages, setAttachedImages] = useState<ImageAsset[]>([]);
  const [imageCompressing, setImageCompressing] = useState(false);

  // Result Tracking Code
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Handle Image Attachments (compressed to webp <= 300KB)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 2) {
      setErrorMsg("แนบรูปภาพได้สูงสุดไม่เกิน 2 รูป");
      return;
    }

    setImageCompressing(true);
    setErrorMsg(null);

    try {
      const newImages: ImageAsset[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file, {
          maxDimension: 1280,
          maxSizeMB: 0.3
        });
        const dataUrl = await fileToDataUrl(compressed);
        const dims = await getImageDimensions(dataUrl);
        newImages.push({
          url: dataUrl,
          width: dims.width,
          height: dims.height,
          alt: file.name
        });
      }
      setAttachedImages(prev => [...prev, ...newImages].slice(0, 2));
    } catch (err) {
      setErrorMsg("ไม่สามารถบีบอัดรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setImageCompressing(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Step Navigations
  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (title.trim().length < 3) {
      setErrorMsg("กรุณาระบุหัวข้อเรื่องอย่างน้อย 3 ตัวอักษร");
      return;
    }
    if (body.trim().length < 10) {
      setErrorMsg("กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  // Final Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // 1. Check honeypot
    if (honeypot) {
      // Quietly ignore spam bot submission
      return;
    }

    // 2. Client-side rate limiting (1 submission per minute)
    const lastSubmitTime = localStorage.getItem('desup_last_complaint_time');
    const now = Date.now();
    if (lastSubmitTime && now - parseInt(lastSubmitTime, 10) < 60000) {
      setErrorMsg("กรุณารอประมาณ 1 นาทีก่อนส่งเรื่องใหม่อีกครั้ง เพื่อป้องกันการส่งข้อมูลซ้ำ");
      return;
    }

    // 3. Validate PDPA consent if specified
    if (!anonymous && !pdpaConsent) {
      setErrorMsg("กรุณายินยอมให้ใช้ข้อมูลติดต่อสำหรับการประสานงาน");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const yearNum = parseInt(academicYearTH, 10) || 2569;
    const trackingCode = generateTrackingCode(yearNum);

    try {
      const nowISO = new Date().toISOString();

      // Write public complaint document
      await setDoc(doc(db, 'complaints', trackingCode), {
        trackingCode,
        type,
        title: title.trim(),
        body: body.trim(),
        location: location.trim() || 'ไม่ระบุ',
        anonymous,
        status: 'received',
        publicReplies: [],
        createdAt: nowISO,
        updatedAt: nowISO
      });

      // Write private contact info in isolated subcollection
      if (!anonymous && (contactName || contactMethod)) {
        await setDoc(doc(db, 'complaints', trackingCode, 'private', 'contact'), {
          name: contactName.trim(),
          gradeClass: gradeClass.trim(),
          contactMethod: contactMethod.trim(),
          submittedAt: nowISO
        });
      }

      // Write private attachments in isolated subcollection (only admins read)
      if (attachedImages.length > 0) {
        await setDoc(doc(db, 'complaints', trackingCode, 'private', 'attachments'), {
          images: attachedImages,
          submittedAt: nowISO
        });
      }

      // Save rate limit timestamp
      localStorage.setItem('desup_last_complaint_time', String(now));

      setGeneratedCode(trackingCode);
      setStep(4);
    } catch (err: unknown) {
      console.error("Complaint submission error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="STUDENT VOICE" thText="รับเรื่องร้องเรียนและข้อเสนอแนะ" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          ส่งเสียงถึงองค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          ช่องทางสื่อสารโดยตรง ปลอดภัย สามารถส่งแบบไม่ระบุตัวตนได้
        </p>
      </div>

      {/* Stepper (Only show on steps 1-3) */}
      {step < 4 && (
        <div className="flex items-center justify-between max-w-md mx-auto text-[11px] sm:text-xs pb-4 border-b border-[#4B1F7A]/10 gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#4B1F7A] text-[#FAF7F0]' : 'bg-stone-200 text-stone-600'}`}>
              1
            </span>
            <span className={step === 1 ? 'font-semibold text-[#2A1245]' : 'text-stone-500'}>ประเภทเรื่อง</span>
          </div>
          <div className="h-[1px] flex-1 mx-1 sm:mx-2 bg-stone-300" />
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-[#4B1F7A] text-[#FAF7F0]' : 'bg-stone-200 text-stone-600'}`}>
              2
            </span>
            <span className={step === 2 ? 'font-semibold text-[#2A1245]' : 'text-stone-500'}>รายละเอียด</span>
          </div>
          <div className="h-[1px] flex-1 mx-1 sm:mx-2 bg-stone-300" />
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[#4B1F7A] text-[#FAF7F0]' : 'bg-stone-200 text-stone-600'}`}>
              3
            </span>
            <span className={step === 3 ? 'font-semibold text-[#2A1245]' : 'text-stone-500'}>ข้อมูลผู้ส่ง</span>
          </div>
        </div>
      )}

      {/* Honeypot field (hidden from view) */}
      <input
        type="text"
        name="website_url_check"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {errorMsg && (
        <div className="p-3 bg-red-50 border-l-2 border-[#9B1C31] text-xs text-[#9B1C31]">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Select Complaint Type */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
            ขั้นตอนที่ ๑: เลือกประเภทเรื่องที่ต้องการส่ง
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLAINT_TYPES.map((t) => (
              <label
                key={t.id}
                onClick={() => setType(t.id)}
                className={`p-4 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                  type === t.id
                    ? 'border-[#B8923A] bg-[#EDE6F5]/50 ring-1 ring-[#B8923A]'
                    : 'border-[#4B1F7A]/15 bg-white hover:border-[#B8923A]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-base font-semibold text-[#1B1226]">
                    {t.title}
                  </h3>
                  <input
                    type="radio"
                    name="complaintType"
                    checked={type === t.id}
                    onChange={() => setType(t.id)}
                    className="accent-[#4B1F7A]"
                  />
                </div>
                <p className="text-xs text-[#1B1226]/70 mt-2 leading-relaxed">
                  {t.desc}
                </p>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleNextStep1}
              className="px-8 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors"
            >
              ถัดไป: กรอกรายละเอียด →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Details & Attachments */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#4B1F7A]/10 pb-2">
            <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
              ขั้นตอนที่ ๒: กรอกรายละเอียดเรื่อง
            </h2>
            <span className="text-xs text-[#9C7A2B]">
              ประเภท: {COMPLAINT_TYPES.find(t => t.id === type)?.title}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                หัวข้อเรื่อง (โปรดระบุให้ชัดเจนและกระชับ) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น เครื่องปรับอากาศห้องเรียน ม.4/1 ไม่ทำงาน, ข้อเสนอแนะการจัดงานสัปดาห์วิทยาศาสตร์"
                className="w-full text-xs input-underline"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                สถานที่หรือฝ่ายที่เกี่ยวข้อง (ถ้ามี)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น อาคารเรียน 2 ชั้น 3, โรงอาหาร, ฝ่ายกิจกรรมนักเรียน"
                className="w-full text-xs input-underline"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                รายละเอียดเนื้อหา (อย่างน้อย 10 ตัวอักษร) *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="อธิบายเหตุการณ์ ปัญหา วันเวลา หรือข้อเสนอแนะที่ต้องการแจ้ง..."
                className="w-full text-xs input-underline"
                required
              />
            </div>

            {/* Photo Attachments (Max 2, private subcollection) */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                แนบภาพถ่ายประกอบ (ไม่บังคับ สูงสุด 2 รูป)
              </label>

              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-sm text-[11px] text-amber-900 mb-2">
                ⚠️ คำเตือน: หลีกเลี่ยงการแนบรูปที่เห็นใบหน้าหรือข้อมูลส่วนตัวของผู้อื่นโดยไม่จำเป็น
                รูปถ่ายจะถูกบีบอัดและเปิดดูได้เฉพาะคณะกรรมการแอดมินเท่านั้น
              </div>

              {attachedImages.length < 2 && (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-white border border-[#4B1F7A]/20 hover:border-[#B8923A] rounded-sm text-xs text-[#2A1245] inline-flex items-center gap-2">
                    <span>📷 เพิ่มรูปภาพ / ถ่ายภาพ</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={imageCompressing}
                    />
                  </label>
                  {imageCompressing && (
                    <span className="text-xs text-stone-500">กำลังบีบอัดรูปภาพ...</span>
                  )}
                </div>
              )}

              {/* Attached Photos Preview */}
              {attachedImages.length > 0 && (
                <div className="flex gap-4 mt-3">
                  {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 border border-stone-300 rounded-sm overflow-hidden bg-stone-100">
                      <img src={img.url} alt="รูปแนบ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-stone-600 hover:text-[#4B1F7A]"
            >
              ← ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              className="px-8 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors"
            >
              ถัดไป: ข้อมูลผู้ส่ง →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Submitter Identity & PDPA */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-[#4B1F7A]/10 pb-2">
            <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
              ขั้นตอนที่ ๓: ข้อมูลผู้ส่งเรื่อง
            </h2>
            <p className="text-xs text-[#1B1226]/60">
              ท่านสามารถเลือกที่จะไม่เปิดเผยตัวตนได้ โดยระบบจะไม่บันทึกชื่อของท่าน
            </p>
          </div>

          <div className="space-y-4">
            {/* Anonymous Toggle */}
            <div className="space-y-3 bg-white p-4 border border-[#4B1F7A]/15 rounded-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="identity"
                  checked={anonymous}
                  onChange={() => setAnonymous(true)}
                  className="accent-[#4B1F7A]"
                />
                <div>
                  <span className="font-serif text-sm font-semibold text-[#2A1245]">
                    ส่งแบบไม่ระบุตัวตน (ค่าเริ่มต้น - ปลอดภัยสูงสุด)
                  </span>
                  <p className="text-xs text-[#1B1226]/60">
                    ข้อมูลผู้ส่งจะไม่ถูกบันทึกในระบบ สามารถติดตามความคืบหน้าด้วยรหัสติดตามเท่านั้น
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-stone-100">
                <input
                  type="radio"
                  name="identity"
                  checked={!anonymous}
                  onChange={() => setAnonymous(false)}
                  className="accent-[#4B1F7A]"
                />
                <div>
                  <span className="font-serif text-sm font-semibold text-[#2A1245]">
                    ระบุตัวตน (เพื่อความสะดวกรวดเร็วในการประสานงานกลับ)
                  </span>
                  <p className="text-xs text-[#1B1226]/60">
                    ข้อมูลจะถูกเก็บเป็นความลับและเห็นได้เฉพาะคณะกรรมการแอดมินขององค์การนักเรียนเท่านั้น
                  </p>
                </div>
              </label>
            </div>

            {/* Submitter details if not anonymous */}
            {!anonymous && (
              <div className="space-y-4 p-4 bg-[#EDE6F5]/30 border border-[#4B1F7A]/15 rounded-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    ชื่อ-นามสกุล (ผู้ส่ง) *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="เช่น นายธนภัทร สุขสมบูรณ์"
                    className="w-full text-xs input-underline"
                    required={!anonymous}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    ระดับชั้น / ห้องเรียน
                  </label>
                  <input
                    type="text"
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder="เช่น ม.5/2"
                    className="w-full text-xs input-underline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    ช่องทางติดต่อกลับ (LINE ID หรือ อีเมล) *
                  </label>
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    placeholder="LINE ID หรือ อีเมลสำหรับรับผลการประสานงาน"
                    className="w-full text-xs input-underline"
                    required={!anonymous}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2 text-xs text-[#1B1226]/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdpaConsent}
                      onChange={(e) => setPdpaConsent(e.target.checked)}
                      className="mt-0.5 accent-[#4B1F7A]"
                      required={!anonymous}
                    />
                    <span>
                      ข้าพเจ้ายินยอมให้องค์การนักเรียนใช้ข้อมูลติดต่อนี้เพื่อวัตถุประสงค์ในการตรวจสอบและแจ้งผลการดำเนินงานเท่านั้น (ตามนโยบายคุ้มครองข้อมูลส่วนบุคคล PDPA)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-stone-600 hover:text-[#4B1F7A]"
            >
              ← ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors shadow-editorial"
            >
              {submitting ? 'กำลังส่งเรื่อง...' : 'ยืนยันและส่งเรื่องร้องเรียน ✓'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success View & Tracking Code */}
      {step === 4 && (
        <div className="bg-[#FAF7F0] border border-[#B8923A]/50 p-5 sm:p-8 md:p-12 rounded-sm shadow-editorial text-center space-y-6 relative">
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          <div className="flex justify-center">
            <SuccessCheck size={120} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#2A1245]">
                องค์การนักเรียนได้รับเรื่องของท่านแล้ว
              </h2>
              <p className="text-xs md:text-sm text-[#1B1226]/70 max-w-md mx-auto">
                ขอขอบคุณสำหรับการมีส่วนร่วมพัฒนาโรงเรียนสาธิตมหาวิทยาลัยพะเยา
                โปรดบันทึกรหัสติดตามด้านล่างนี้ไว้เพื่อตรวจสอบสถานะ
              </p>
            </div>

            {/* Large Tracking Code Display */}
            <div className="p-6 bg-white border border-[#B8923A] rounded-sm max-w-md mx-auto space-y-3">
              <span className="text-[11px] uppercase tracking-widest text-[#9C7A2B] font-semibold">
                รหัสติดตามเรื่องร้องเรียน (TRACKING CODE)
              </span>
              <div className="font-serif text-3xl md:text-4xl font-bold text-[#4B1F7A] tracking-wider font-mono">
                {generatedCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-1.5 bg-[#FAF7F0] border border-[#B8923A]/60 text-xs text-[#2A1245] rounded-sm hover:bg-[#EDE6F5] transition-colors"
              >
                {copied ? 'คัดลอกรหัสเรียบร้อยแล้ว ✓' : '📋 คัดลอกรหัสติดตาม'}
              </button>
            </div>

            <div className="text-xs text-[#1B1226]/60 max-w-md mx-auto">
              💡 เนื่องจากระบบไม่ได้บังคับให้ล็อกอิน รหัสนี้คือกุญแจดอกเดียวในการเข้าดูผลการพิจารณาและการตอบกลับจากคณะทำงาน
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                to="/track"
                className="px-6 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors"
              >
                ไปที่หน้าติดตามสถานะ →
              </Link>
              <Link
                to="/"
                className="px-6 py-2.5 border border-stone-300 text-[#1B1226] text-xs font-medium rounded-full hover:bg-white transition-colors"
              >
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
