/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLang } from '../i18n';

export interface L10nTextResult {
  /** ข้อความที่เลือกมาแสดงผลตามภาษาปัจจุบัน */
  text: string;
  /** เป็นการแสดงผลสำรองจากอีกภาษาหนึ่งหรือไม่ (เช่น ผู้ใช้เปิด EN แต่ยังไม่มีคำแปล EN จึงแสดง TH แทน) */
  isFallback: boolean;
}

/**
 * ตรวจสอบว่าข้อความ HTML จาก Rich Text Editor (Tiptap) มีเนื้อหาจริงหรือไม่
 */
export function hasRichContent(html?: string | null): boolean {
  if (!html) return false;
  if (/<(?:img|iframe|video|embed)\b/i.test(html)) return true;
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return plain.length > 0;
}

/**
 * แปลงค่า HTML ว่างเปล่าของ Tiptap (เช่น "<p></p>") เป็นสตริงว่างเพื่อจัดเก็บสะอาดในฐานข้อมูล
 */
export function normalizeRichHtml(html?: string | null): string {
  return hasRichContent(html) ? (html || '').trim() : '';
}

/**
 * เลือกข้อความตามภาษาปัจจุบัน พร้อมระบุสถานะว่าใช้ข้อความสำรองหรือไม่
 */
export function pickL10n(
  thValue?: string | null,
  enValue?: string | null,
  lang: SupportedLang = 'th'
): L10nTextResult {
  const th = (thValue || '').trim();
  const en = (enValue || '').trim();

  if (lang === 'en') {
    if (en) return { text: en, isFallback: false };
    if (th) return { text: th, isFallback: true };
    return { text: '', isFallback: false };
  }

  if (th) return { text: th, isFallback: false };
  if (en) return { text: en, isFallback: true };
  return { text: '', isFallback: false };
}

/**
 * เลือกเนื้อหา Rich HTML ตามภาษาปัจจุบัน พร้อมระบุสถานะการแสดงสำรอง
 */
export function pickHtmlL10n(
  thHtml?: string | null,
  enHtml?: string | null,
  lang: SupportedLang = 'th'
): { html: string; isFallback: boolean } {
  const hasTh = hasRichContent(thHtml);
  const hasEn = hasRichContent(enHtml);

  if (lang === 'en') {
    if (hasEn) return { html: enHtml || '', isFallback: false };
    if (hasTh) return { html: thHtml || '', isFallback: true };
    return { html: '', isFallback: false };
  }

  if (hasTh) return { html: thHtml || '', isFallback: false };
  if (hasEn) return { html: enHtml || '', isFallback: true };
  return { html: '', isFallback: false };
}

/**
 * เลือกรายการข้อความ (เช่น แถบประกาศวิ่ง Ticker) ตามภาษาปัจจุบัน
 */
export function pickArrayL10n(
  thList?: string[],
  enList?: string[],
  lang: SupportedLang = 'th'
): { items: string[]; isFallback: boolean } {
  const cleanTh = (thList || []).map((s) => s.trim()).filter(Boolean);
  const cleanEn = (enList || []).map((s) => s.trim()).filter(Boolean);

  if (lang === 'en') {
    if (cleanEn.length > 0) return { items: cleanEn, isFallback: false };
    if (cleanTh.length > 0) return { items: cleanTh, isFallback: true };
    return { items: [], isFallback: false };
  }

  if (cleanTh.length > 0) return { items: cleanTh, isFallback: false };
  if (cleanEn.length > 0) return { items: cleanEn, isFallback: true };
  return { items: [], isFallback: false };
}

/**
 * ตรวจสอบความพร้อมของคำแปลภาษาอังกฤษเพื่อใช้แสดงตัวชี้วัดในระบบหลังบ้าน (Admin)
 */
export function hasAnyEnTranslation(...fields: Array<string | undefined | null>): boolean {
  return fields.some((f) => Boolean(f && f.trim().length > 0));
}
