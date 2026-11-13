/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format date to Thai Buddhist Era (พ.ศ.)
 * e.g., "12 พฤศจิกายน 2569"
 */
export function formatThaiDate(dateInput: string | number | Date, short = false): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = short ? THAI_MONTHS_SHORT[d.getMonth()] : THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;

  return `${day} ${month} ${yearBE}`;
}

/**
 * Format date with time in Thai
 * e.g., "12 พ.ย. 2569 เวลา 08:30 น."
 */
export function formatThaiDateTime(dateInput: string | number | Date): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const dateStr = formatThaiDate(d, true);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${dateStr} เวลา ${hours}:${minutes} น.`;
}

/**
 * Split date for calendar/event editorial display
 * Returns { day: "12", monthShort: "พ.ย.", yearBE: "2569" }
 */
export function getThaiDateParts(dateInput: string | number | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return { day: '01', monthShort: 'ม.ค.', yearBE: '2569', raw: d };
  }
  return {
    day: String(d.getDate()).padStart(2, '0'),
    monthShort: THAI_MONTHS_SHORT[d.getMonth()],
    monthFull: THAI_MONTHS_FULL[d.getMonth()],
    yearBE: String(d.getFullYear() + 543),
    raw: d
  };
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
 * Format numbers with comma grouping in Arabic numerals
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('th-TH').format(num);
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
