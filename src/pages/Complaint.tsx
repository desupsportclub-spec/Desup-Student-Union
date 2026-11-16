/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { motion } from 'motion/react';
import { auth, db, googleProvider } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { ComplaintType, ImageAsset } from '../types';
import { generateTrackingCode, formatDateTime } from '../lib/format';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { LocLink } from '../components/common/LocLink';
import { SeoHead } from '../components/common/SeoHead';
import { compressImageFile, fileToDataUrl, getImageDimensions } from '../lib/imageService';
import {
  generateTicketReceiptBlob,
  saveComplaintToLocalHistory,
  saveRecoveryLookup,
} from '../lib/complaintTracking';
import { incrementPublicComplaintStats } from '../lib/complaintStatsSync';
import { SuccessCheck } from '../components/SuccessCheck';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../lib/i18nRouting';

const COMPLAINT_TYPE_IDS: ComplaintType[] = [
  'complaint',
  'suggestion',
  'corruption',
  'inquiry',
  'compliment',
  'other',
];

export const Complaint: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
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

  // Recovery & Cross-device sync (Optional)
  const [recoveryKeyword, setRecoveryKeyword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [linkGoogleAccount, setLinkGoogleAccount] = useState<boolean>(Boolean(auth.currentUser));
  const [authLoading, setAuthLoading] = useState(false);

  // Result Tracking Code
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [submittedTitle, setSubmittedTitle] = useState<string>('');
  const [submittedAtISO, setSubmittedAtISO] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) setLinkGoogleAccount(true);
    });
    return () => unsub();
  }, []);

  // Handle Image Attachments (compressed to webp <= 300KB)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 2) {
      setErrorMsg(t('complaint.errors.maxImages'));
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
    } catch {
      setErrorMsg(t('complaint.errors.compressFailed'));
    } finally {
      setImageCompressing(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // ขั้นตอนการเปลี่ยน Step
  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (title.trim().length < 3) {
      setErrorMsg(t('complaint.errors.titleTooShort'));
      return;
    }
    if (body.trim().length < 10) {
      setErrorMsg(t('complaint.errors.bodyTooShort'));
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  // ส่งข้อมูลขั้นสุดท้าย
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // 1. ตรวจสอบช่องดักสแปม
    if (honeypot) {
      return;
    }

    // 2. จำกัดความถี่การส่งฝั่งไคลเอนต์ (1 ครั้งต่อนาที)
    const lastSubmitTime = localStorage.getItem('desup_last_complaint_time');
    const now = Date.now();
    if (lastSubmitTime && now - parseInt(lastSubmitTime, 10) < 60000) {
      setErrorMsg(t('complaint.errors.rateLimited'));
      return;
    }

    // 3. ตรวจสอบความยินยอม PDPA กรณีระบุตัวตน
    if (!anonymous && !pdpaConsent) {
      setErrorMsg(t('complaint.errors.pdpaRequired'));
      return;
    }

    // 4. ตรวจสอบคำจำส่วนตัวและรหัส PIN กรณีกู้คืน
    const hasKeyword = recoveryKeyword.trim().length > 0;
    const hasPin = recoveryPin.trim().length > 0;
    if (hasKeyword || hasPin) {
      if (recoveryKeyword.trim().length < 2) {
        setErrorMsg(t('complaint.errors.keywordTooShort'));
        return;
      }
      if (recoveryPin.trim().length < 4) {
        setErrorMsg(t('complaint.errors.pinTooShort'));
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    const yearNum = parseInt(academicYearTH, 10) || 2569;
    const trackingCode = generateTrackingCode(yearNum);
    const cleanTitle = title.trim();

    try {
      const nowISO = new Date().toISOString();

      const complaintPayload: Record<string, unknown> = {
        trackingCode,
        type,
        title: cleanTitle,
        body: body.trim(),
        location: location.trim() || 'ไม่ระบุ',
        anonymous,
        status: 'received',
        publicReplies: [],
        createdAt: nowISO,
        updatedAt: nowISO
      };

      if (linkGoogleAccount && currentUser?.uid) {
        complaintPayload.reporterUid = currentUser.uid;
      }

      // Write public complaint document
      await setDoc(doc(db, 'complaints', trackingCode), complaintPayload);

      const followUpTasks: Promise<unknown>[] = [];

      // Write private contact info in isolated subcollection
      if (!anonymous && (contactName || contactMethod)) {
        followUpTasks.push(
          setDoc(doc(db, 'complaints', trackingCode, 'private', 'contact'), {
            name: contactName.trim(),
            gradeClass: gradeClass.trim(),
            contactMethod: contactMethod.trim(),
            submittedAt: nowISO
          })
        );
      }

      // Write private attachments in isolated subcollection (only admins read)
      if (attachedImages.length > 0) {
        followUpTasks.push(
          setDoc(doc(db, 'complaints', trackingCode, 'private', 'attachments'), {
            images: attachedImages,
            submittedAt: nowISO
          })
        );
      }

      // Write SHA-256 recovery lookup entry if user configured personal recovery PIN
      if (hasKeyword && hasPin) {
        followUpTasks.push(
          saveRecoveryLookup(recoveryKeyword, recoveryPin, trackingCode)
        );
      }

      // Increment public homepage summary counters
      followUpTasks.push(incrementPublicComplaintStats());

      await Promise.all(followUpTasks);

      // Automatically save to this device's local history so user never loses it on this phone/iPad
      saveComplaintToLocalHistory({
        trackingCode,
        title: cleanTitle,
        type,
        createdAt: nowISO,
      });

      // Save rate limit timestamp
      localStorage.setItem('desup_last_complaint_time', String(now));

      setGeneratedCode(trackingCode);
      setSubmittedTitle(cleanTitle);
      setSubmittedAtISO(nowISO);
      setStep(4);
    } catch (err: unknown) {
      console.error("Complaint submission error:", err);
      setErrorMsg(t('complaint.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectGoogle = async () => {
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setCurrentUser(res.user);
      setLinkGoogleAccount(true);
    } catch {
      setErrorMsg(t('complaint.errors.googleFailed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const localizedTrackPath = localizePath(`/track?code=${generatedCode}`, lang);
  const directTrackUrl =
    typeof window !== 'undefined' && generatedCode
      ? `${window.location.origin}${localizedTrackPath}`
      : localizedTrackPath;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyTrackLink = () => {
    navigator.clipboard.writeText(directTrackUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadTicketImage = async () => {
    if (!generatedCode || downloadingTicket) return;
    setDownloadingTicket(true);
    try {
      const blob = await generateTicketReceiptBlob({
        trackingCode: generatedCode,
        title: submittedTitle || t('complaint.defaultTicketTitle'),
        dateText: formatDateTime(submittedAtISO || new Date().toISOString(), lang),
        trackUrl: directTrackUrl,
      });
      if (!blob) return;

      const fileName = `ticket-${generatedCode}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // ใช้เมนูแชร์ของระบบบน iOS/iPadOS หากรองรับเพื่อให้ผู้ใช้บันทึกรูปภาพได้สะดวก
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: t('complaint.ticketShareTitle', { code: generatedCode }),
            text: t('complaint.ticketShareText', { url: directTrackUrl }),
          });
          return;
        } catch {
          // ผู้ใช้ยกเลิกการแชร์ ให้ดาวน์โหลดไฟล์โดยตรงแทน
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setDownloadingTicket(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
      <SeoHead titleKey="seo.pages.complaint.title" descriptionKey="seo.pages.complaint.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText={t('complaint.eyebrowEn')} thText={t('complaint.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          {t('complaint.title')}
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          {t('complaint.subtitle')}
        </p>
      </div>

      {/* ตัวบ่งชี้ขั้นตอน (แสดงเฉพาะขั้นตอน 1-3) */}
      {step < 4 && (
        <div className="flex items-center justify-between max-w-md mx-auto text-[11px] sm:text-xs pb-4 border-b border-gold-border/15 gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-brand text-brand-contrast' : 'bg-bg-alt text-text-muted'}`}>
              1
            </span>
            <span className={step === 1 ? 'font-semibold text-heading' : 'text-text-muted'}>{t('complaint.steps.step1')}</span>
          </div>
          <div className="h-[1px] flex-1 mx-1 sm:mx-2 bg-gold-border/25" />
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-brand text-brand-contrast' : 'bg-bg-alt text-text-muted'}`}>
              2
            </span>
            <span className={step === 2 ? 'font-semibold text-heading' : 'text-text-muted'}>{t('complaint.steps.step2')}</span>
          </div>
          <div className="h-[1px] flex-1 mx-1 sm:mx-2 bg-gold-border/25" />
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-brand text-brand-contrast' : 'bg-bg-alt text-text-muted'}`}>
              3
            </span>
            <span className={step === 3 ? 'font-semibold text-heading' : 'text-text-muted'}>{t('complaint.steps.step3')}</span>
          </div>
        </div>
      )}

      {/* ช่องดักสแปมบอท (ซ่อนจากผู้ใช้งาน) */}
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
        <div className="p-3 bg-error-bg border-l-2 border-error text-xs text-error">
          {errorMsg}
        </div>
      )}

      {/* ขั้นตอนที่ 1: เลือกประเภทเรื่อง */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-serif text-xl font-semibold text-heading">
            {t('complaint.step1Heading')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLAINT_TYPE_IDS.map((typeId) => (
              <label
                key={typeId}
                onClick={() => setType(typeId)}
                className={`p-4 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                  type === typeId
                    ? 'border-gold bg-brand-soft/60 ring-1 ring-gold'
                    : 'border-gold-border/20 bg-surface-elevated hover:border-gold/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-base font-semibold text-heading">
                    {t(`complaint.types.${typeId}.title`)}
                  </h3>
                  <input
                    type="radio"
                    name="complaintType"
                    checked={type === typeId}
                    onChange={() => setType(typeId)}
                    className="accent-brand"
                  />
                </div>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  {t(`complaint.types.${typeId}.desc`)}
                </p>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleNextStep1}
              className="px-8 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors"
            >
              {t('complaint.nextToStep2')}
            </button>
          </div>
        </div>
      )}

      {/* ขั้นตอนที่ 2: กรอกรายละเอียดและแนบรูปภาพ */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gold-border/15 pb-2">
            <h2 className="font-serif text-xl font-semibold text-heading">
              {t('complaint.step2Heading')}
            </h2>
            <span className="text-xs text-gold-text">
              {t('complaint.selectedTypeLabel', { type: t(`complaint.types.${type}.title`) })}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-heading mb-1">
                {t('complaint.subjectLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('complaint.subjectPlaceholder')}
                className="w-full text-xs input-underline"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-heading mb-1">
                {t('complaint.locationLabel')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('complaint.locationPlaceholder')}
                className="w-full text-xs input-underline"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-heading mb-1">
                {t('complaint.bodyLabel')}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder={t('complaint.bodyPlaceholder')}
                className="w-full text-xs input-underline"
                required
              />
            </div>

            {/* แนบภาพถ่าย (สูงสุด 2 รูป เก็บใน subcollection ส่วนตัว) */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-heading mb-1">
                {t('complaint.attachLabel')}
              </label>

              <div className="bg-warning-bg border border-warning/30 p-2.5 rounded-sm text-[11px] text-warning mb-2">
                {t('complaint.attachWarning')}
              </div>

              {attachedImages.length < 2 && (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-surface-elevated border border-gold-border/25 hover:border-gold rounded-sm text-xs text-heading inline-flex items-center gap-2 transition-colors">
                    <span>{t('complaint.addImageBtn')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={imageCompressing}
                    />
                  </label>
                  {imageCompressing && (
                    <span className="text-xs text-text-muted">{t('complaint.compressing')}</span>
                  )}
                </div>
              )}

              {/* ตัวอย่างรูปภาพที่แนบ */}
              {attachedImages.length > 0 && (
                <div className="flex gap-4 mt-3">
                  {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 border border-gold-border/30 rounded-sm overflow-hidden bg-bg-alt">
                      <img src={img.url} alt={t('complaint.attachedAlt')} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-anchor-bg-deep/80 text-anchor-text rounded-full flex items-center justify-center text-[10px]"
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
              className="text-xs text-text-muted hover:text-accent"
            >
              {t('complaint.backBtn')}
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              className="px-8 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors"
            >
              {t('complaint.nextToStep3')}
            </button>
          </div>
        </div>
      )}

      {/* ขั้นตอนที่ 3: ข้อมูลผู้ส่งและการยินยอม PDPA */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gold-border/15 pb-2">
            <h2 className="font-serif text-xl font-semibold text-heading">
              {t('complaint.step3Heading')}
            </h2>
            <p className="text-xs text-text-muted">
              {t('complaint.step3Sub')}
            </p>
          </div>

          <div className="space-y-4">
            {/* ตัวเลือกการเปิดเผยตัวตน */}
            <div className="space-y-3 bg-surface-elevated p-4 border border-gold-border/20 rounded-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="identity"
                  checked={anonymous}
                  onChange={() => setAnonymous(true)}
                  className="accent-brand"
                />
                <div>
                  <span className="font-serif text-sm font-semibold text-heading">
                    {t('complaint.anonTitle')}
                  </span>
                  <p className="text-xs text-text-muted">
                    {t('complaint.anonDesc')}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-gold-border/15">
                <input
                  type="radio"
                  name="identity"
                  checked={!anonymous}
                  onChange={() => setAnonymous(false)}
                  className="accent-brand"
                />
                <div>
                  <span className="font-serif text-sm font-semibold text-heading">
                    {t('complaint.identifiedTitle')}
                  </span>
                  <p className="text-xs text-text-muted">
                    {t('complaint.identifiedDesc')}
                  </p>
                </div>
              </label>
            </div>

            {/* ข้อมูลติดต่อกรณีเลือกระบุตัวตน */}
            {!anonymous && (
              <div className="space-y-4 p-4 bg-brand-soft/35 border border-gold-border/20 rounded-sm">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">
                    {t('complaint.contactNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('complaint.contactNamePlaceholder')}
                    className="w-full text-xs input-underline"
                    required={!anonymous}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">
                    {t('complaint.gradeClassLabel')}
                  </label>
                  <input
                    type="text"
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder={t('complaint.gradeClassPlaceholder')}
                    className="w-full text-xs input-underline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">
                    {t('complaint.contactMethodLabel')}
                  </label>
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    placeholder={t('complaint.contactMethodPlaceholder')}
                    className="w-full text-xs input-underline"
                    required={!anonymous}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2 text-xs text-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdpaConsent}
                      onChange={(e) => setPdpaConsent(e.target.checked)}
                      className="mt-0.5 accent-brand"
                      required={!anonymous}
                    />
                    <span>
                      {t('complaint.pdpaAgree')}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ตัวเลือกช่วยจำและกู้คืนข้ามเครื่อง */}
            <div className="p-4 sm:p-5 bg-surface border border-gold-border/40 rounded-sm space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-semibold text-heading">
                  {t('complaint.recoveryBoxTitle')}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('complaint.recoveryBoxDesc')}
                </p>
              </div>

              {/* ตัวเลือก ก: คำจำส่วนตัว + รหัส PIN */}
              <div className="pt-2 border-t border-gold-border/15 space-y-2">
                <label className="block text-xs font-semibold text-heading">
                  {t('complaint.recoveryPinLabel')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={recoveryKeyword}
                    onChange={(e) => setRecoveryKeyword(e.target.value)}
                    placeholder={t('complaint.recoveryKeywordPlaceholder')}
                    className="w-full text-xs input-underline bg-surface-elevated px-2.5"
                    maxLength={50}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder={t('complaint.recoveryPinPlaceholder')}
                    className="w-full text-xs input-underline bg-surface-elevated px-2.5"
                    maxLength={12}
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  {t('complaint.recoveryHashNote')}
                </p>
              </div>

              {/* ตัวเลือก ข: เชื่อมต่อบัญชี Google เพื่อซิงค์ข้ามเครื่อง */}
              <div className="pt-2 border-t border-gold-border/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {currentUser ? (
                  <label className="flex items-center gap-2 text-xs text-heading cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkGoogleAccount}
                      onChange={(e) => setLinkGoogleAccount(e.target.checked)}
                      className="accent-brand"
                    />
                    <span>
                      {t('complaint.googleLinkChecked')}<strong>{currentUser.email}</strong>{t('complaint.googleLinkCheckedEnd')}
                    </span>
                  </label>
                ) : (
                  <>
                    <span className="text-xs text-text-muted">
                      {t('complaint.googleSyncDesc')}
                    </span>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={authLoading}
                      className="px-3.5 py-1.5 bg-surface-elevated border border-gold-border/25 hover:border-gold text-xs font-medium text-heading rounded-sm shrink-0 transition-colors"
                    >
                      {authLoading ? t('complaint.connectingGoogle') : t('complaint.connectGoogle')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-text-muted hover:text-accent"
            >
              {t('complaint.backBtn')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors shadow-editorial"
            >
              {submitting ? t('complaint.submitting') : t('complaint.submitBtn')}
            </button>
          </div>
        </form>
      )}

      {/* ขั้นตอนที่ 4: ส่งสำเร็จและแสดงรหัสติดตามเรื่อง */}
      {step === 4 && (
        <div className="bg-surface border border-gold-border/50 p-5 sm:p-8 md:p-12 rounded-sm shadow-editorial text-center space-y-6 relative">
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
            transition={{ delay: 1.2, duration: 0.4 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-heading">
                {t('complaint.successTitle')}
              </h2>
              <p className="text-xs md:text-sm text-text-muted max-w-md mx-auto">
                {t('complaint.successDesc')}
              </p>
            </div>

            {/* กล่องแสดงรหัสติดตามเรื่องขนาดใหญ่ */}
            <div className="p-5 sm:p-6 bg-surface-elevated border border-gold rounded-sm max-w-md mx-auto space-y-4">
              <span className="text-[11px] uppercase tracking-widest text-gold-text font-semibold block">
                {t('complaint.trackingCodeHeading')}
              </span>
              <div className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-accent tracking-wider font-mono">
                {generatedCode}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadTicketImage}
                  disabled={downloadingTicket}
                  className="px-4 py-2 bg-brand text-brand-contrast text-xs font-medium rounded-sm hover:bg-brand-hover transition-colors"
                >
                  {downloadingTicket ? t('complaint.creatingTicket') : t('complaint.downloadTicket')}
                </button>
                <button
                  type="button"
                  onClick={handleCopyTrackLink}
                  className="px-3.5 py-2 bg-surface border border-gold/60 text-xs text-heading rounded-sm hover:bg-brand-soft transition-colors"
                >
                  {copiedLink ? t('complaint.copiedLink') : t('complaint.copyLink')}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 bg-surface border border-gold-border/30 text-xs text-heading rounded-sm hover:bg-bg-alt transition-colors"
                >
                  {copied ? t('complaint.copiedCode') : t('complaint.copyCode')}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3 sm:gap-4">
              <LocLink
                to={`/track?code=${generatedCode}`}
                className="px-6 py-2.5 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors"
              >
                {t('complaint.trackThisCase')}
              </LocLink>
              <LocLink
                to="/"
                className="px-6 py-2.5 border border-gold-border/30 text-heading text-xs font-medium rounded-full hover:bg-surface-elevated transition-colors"
              >
                {t('complaint.backHome')}
              </LocLink>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
