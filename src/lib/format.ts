/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLang } from '../i18n';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const EN_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * แปลงปี พ.ศ. หรือ ค.ศ. ให้เหมาะกับภาษาที่แสดงผล (th = พ.ศ., en = ค.ศ.)
 */
export function formatAcademicYear(yearTH: string, lang: SupportedLang = 'th'): string {
  const numeric = parseInt(yearTH, 10);
  if (isNaN(numeric)) return yearTH;
  if (lang === 'en' && numeric > 2400) {
    return String(numeric - 543);
  }
  if (lang === 'th' && numeric < 2200) {
    return String(numeric + 543);
  }
  return String(numeric);
}

/**
 * จัดรูปแบบวันที่ตามภาษาปัจจุบัน (ภาษาไทยใช้ พ.ศ., ภาษาอังกฤษใช้ ค.ศ.)
 */
export function formatDate(
  dateInput: string | number | Date,
  lang: SupportedLang = 'th',
  short = false
): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  if (lang === 'en') {
    const month = short ? EN_MONTHS_SHORT[d.getMonth()] : EN_MONTHS_FULL[d.getMonth()];
    return `${day} ${month} ${d.getFullYear()}`;
  }

  const month = short ? THAI_MONTHS_SHORT[d.getMonth()] : THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${month} ${yearBE}`;
}

/**
 * จัดรูปแบบวันและเวลาตามภาษาปัจจุบัน
 */
export function formatDateTime(
  dateInput: string | number | Date,
  lang: SupportedLang = 'th'
): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const dateStr = formatDate(d, lang, true);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (lang === 'en') {
    return `${dateStr}, ${hours}:${minutes}`;
  }
  return `${dateStr} เวลา ${hours}:${minutes} น.`;
}

/**
 * แยกองค์ประกอบวันที่สำหรับแสดงการ์ดปฏิทินตามภาษาปัจจุบัน
 */
export function getDateParts(dateInput: string | number | Date, lang: SupportedLang = 'th') {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return {
      day: '01',
      monthShort: lang === 'en' ? 'Jan' : 'ม.ค.',
      monthFull: lang === 'en' ? 'January' : 'มกราคม',
      yearDisplay: lang === 'en' ? '2026' : '2569',
      yearBE: '2569',
      raw: d,
    };
  }
  const monthIdx = d.getMonth();
  const yearBE = String(d.getFullYear() + 543);
  const yearCE = String(d.getFullYear());
  return {
    day: String(d.getDate()).padStart(2, '0'),
    monthShort: lang === 'en' ? EN_MONTHS_SHORT[monthIdx] : THAI_MONTHS_SHORT[monthIdx],
    monthFull: lang === 'en' ? EN_MONTHS_FULL[monthIdx] : THAI_MONTHS_FULL[monthIdx],
    yearDisplay: lang === 'en' ? yearCE : yearBE,
    yearBE,
    raw: d,
  };
}

/**
 * คงฟังก์ชันเดิมไว้เพื่อความเข้ากันได้ย้อนหลัง (Backwards compatibility)
 */
export function formatThaiDate(dateInput: string | number | Date, short = false): string {
  return formatDate(dateInput, 'th', short);
}

export function formatThaiDateTime(dateInput: string | number | Date): string {
  return formatDateTime(dateInput, 'th');
}

export function getThaiDateParts(dateInput: string | number | Date) {
  return getDateParts(dateInput, 'th');
}

/**
 * Local calendar date key (YYYY-MM-DD) in the viewer's timezone
 */
export function getLocalTodayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Extract YYYY-MM-DD key from an ISO date or YYYY-MM-DD string
 */
export function getEventDateKey(dateInput?: string): string {
  if (!dateInput) return '';
  const isoPrefix = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix && (dateInput.length === 10 || dateInput.includes('T00:00:00'))) {
    return isoPrefix[1];
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return isoPrefix ? isoPrefix[1] : '';
  return getLocalTodayDateKey(d);
}

/**
 * Determine whether an event is ongoing (within start..end date), upcoming, or already past
 */
export function getEventScheduleStatus(
  startAt?: string,
  endAt?: string,
  now: Date = new Date()
): 'ongoing' | 'upcoming' | 'past' {
  const startKey = getEventDateKey(startAt);
  if (!startKey) return 'past';
  const rawEndKey = getEventDateKey(endAt);
  const endKey = rawEndKey && rawEndKey >= startKey ? rawEndKey : startKey;
  const todayKey = getLocalTodayDateKey(now);

  if (todayKey > endKey) return 'past';
  if (todayKey >= startKey && todayKey <= endKey) return 'ongoing';
  return 'upcoming';
}

/**
 * True if an event is currently within its date range or scheduled for a future date
 */
export function isEventActiveOrUpcoming(
  evt: { startAt?: string; endAt?: string },
  now: Date = new Date()
): boolean {
  return getEventScheduleStatus(evt.startAt, evt.endAt, now) !== 'past';
}

/**
 * True if an event spans across the given YYYY-MM-DD date key
 */
export function isEventOnDateKey(
  evt: { startAt?: string; endAt?: string },
  dayKey: string
): boolean {
  const startKey = getEventDateKey(evt.startAt);
  if (!startKey || !dayKey) return false;
  const rawEndKey = getEventDateKey(evt.endAt);
  const endKey = rawEndKey && rawEndKey >= startKey ? rawEndKey : startKey;
  return dayKey >= startKey && dayKey <= endKey;
}

/**
 * Generate Tracking Code for Complaints
 * Format: SC-2569-XXXXXX (no 0, O, 1, I to prevent human transcription errors)
 */
export function generateTrackingCode(yearBE = 2569): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    randomPart += chars[idx];
  }
  return `SC-${yearBE}-${randomPart}`;
}

/**
 * จัดรูปแบบตัวเลขคั่นหลักพันตามภาษา
 */
export function formatNumber(
  num: number | undefined | null,
  lang: SupportedLang = 'th'
): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'th-TH').format(num);
}

/**
 * Format currency in Thai Baht (บาท)
 */
export function formatBaht(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 บาท';
  return `${new Intl.NumberFormat('th-TH').format(amount)} บาท`;
}

/**
 * Create URL slug from title
 */
export function slugifyThai(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 100);
}
