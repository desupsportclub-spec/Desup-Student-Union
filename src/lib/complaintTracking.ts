/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ComplaintItem, ComplaintType } from '../types';

export interface LocalComplaintRecord {
  trackingCode: string;
  title: string;
  type?: ComplaintType;
  createdAt: string;
}

const LOCAL_HISTORY_KEY = 'desup_my_complaints';

export function getLocalComplaintHistory(): LocalComplaintRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LocalComplaintRecord =>
        Boolean(item && typeof item.trackingCode === 'string' && typeof item.title === 'string')
    );
  } catch {
    return [];
  }
}

export function saveComplaintToLocalHistory(entry: LocalComplaintRecord): void {
  try {
    const existing = getLocalComplaintHistory().filter(
      (item) => item.trackingCode !== entry.trackingCode
    );
    const next = [entry, ...existing].slice(0, 30);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function removeComplaintFromLocalHistory(trackingCode: string): void {
  try {
    const next = getLocalComplaintHistory().filter(
      (item) => item.trackingCode !== trackingCode
    );
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
}

/**
 * Computes a deterministic 64-char SHA-256 hex digest of (keyword + ':' + pin)
 * so students can recover complaints cross-device without storing plaintext PII.
 */
export async function hashRecoveryKey(keyword: string, pin: string): Promise<string> {
  const normalized = `${keyword.trim().toLowerCase()}::${pin.trim()}`;
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function saveRecoveryLookup(
  keyword: string,
  pin: string,
  trackingCode: string
): Promise<void> {
  const hash = await hashRecoveryKey(keyword, pin);
  const ref = doc(db, 'complaintLookups', hash);
  let existingCodes: string[] = [];

  try {
    const snap = await getDoc(ref);
    if (snap.exists() && Array.isArray(snap.data().codes)) {
      existingCodes = snap.data().codes.filter((c: unknown) => typeof c === 'string');
    }
  } catch {
    // Doc doesn't exist yet
  }

  const nextCodes = [trackingCode, ...existingCodes.filter((c) => c !== trackingCode)].slice(0, 50);
  await setDoc(ref, {
    codes: nextCodes,
    updatedAt: new Date().toISOString(),
  });
}

export async function findComplaintsByRecoveryKey(
  keyword: string,
  pin: string
): Promise<ComplaintItem[]> {
  const hash = await hashRecoveryKey(keyword, pin);
  const lookupSnap = await getDoc(doc(db, 'complaintLookups', hash));
  if (!lookupSnap.exists()) return [];

  const codes = Array.isArray(lookupSnap.data().codes)
    ? (lookupSnap.data().codes as unknown[]).filter((c): c is string => typeof c === 'string')
    : [];

  if (codes.length === 0) return [];

  const docs = await Promise.all(
    codes.slice(0, 20).map(async (code) => {
      try {
        const snap = await getDoc(doc(db, 'complaints', code));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as ComplaintItem) : null;
      } catch {
        return null;
      }
    })
  );

  return docs
    .filter((item): item is ComplaintItem => item !== null)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Generates an official PNG ticket card image that students can save directly to
 * iPhone/iPad Photos or device storage so they never lose their tracking code.
 * หมายเหตุ: สีบน Canvas รูปภาพบัตรรับเรื่องถูกตั้งคงที่แบบกระดาษสว่างเพื่อความคมชัดในการบันทึก/พิมพ์
 */
export async function generateTicketReceiptBlob(params: {
  trackingCode: string;
  title: string;
  dateText: string;
  trackUrl: string;
}): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const width = 840;
  const height = 460;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // พื้นหลังกระดาษบัตรสำหรับพิมพ์/บันทึก
  ctx.fillStyle = '#FAF7F0';
  ctx.fillRect(0, 0, width, height);

  // Purple top header band
  ctx.fillStyle = '#2A1245';
  ctx.fillRect(0, 0, width, 108);

  // Gold accent border
  ctx.strokeStyle = '#B8923A';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Header text
  ctx.fillStyle = '#D9B867';
  ctx.font = '600 16px sans-serif';
  ctx.fillText('STUDENT UNION · DEMONSTRATION SCHOOL OF UNIVERSITY OF PHAYAO', 44, 52);

  ctx.fillStyle = '#FAF7F0';
  ctx.font = '700 24px sans-serif';
  ctx.fillText('บัตรยืนยันการรับเรื่องร้องเรียน / ข้อเสนอแนะ', 44, 86);

  // Tracking Code box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(44, 134, width - 88, 118);
  ctx.strokeStyle = '#B8923A';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 134, width - 88, 118);

  ctx.fillStyle = '#9C7A2B';
  ctx.font = '600 15px sans-serif';
  ctx.fillText('CASE ID สำหรับติดตามความคืบหน้า', 68, 166);

  ctx.fillStyle = '#4B1F7A';
  ctx.font = '700 44px monospace';
  ctx.fillText(params.trackingCode, 68, 222);

  // Title & Metadata
  ctx.fillStyle = '#1B1226';
  ctx.font = '600 20px sans-serif';
  const cleanTitle = params.title.length > 52 ? `${params.title.slice(0, 52)}...` : params.title;
  ctx.fillText(`เรื่อง: ${cleanTitle}`, 44, 294);

  ctx.fillStyle = '#4A3F55';
  ctx.font = '400 16px sans-serif';
  ctx.fillText(`วันที่บันทึก: ${params.dateText}`, 44, 330);

  // Direct Track URL
  ctx.fillStyle = '#EDE6F5';
  ctx.fillRect(44, 356, width - 88, 56);
  ctx.fillStyle = '#2A1245';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('ลิงก์เปิดดูสถานะโดยตรง:', 60, 380);
  ctx.fillStyle = '#4B1F7A';
  ctx.font = '400 13px monospace';
  const cleanUrl = params.trackUrl.length > 74 ? `${params.trackUrl.slice(0, 74)}...` : params.trackUrl;
  ctx.fillText(cleanUrl, 60, 400);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
