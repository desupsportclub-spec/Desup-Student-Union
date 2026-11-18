/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersonItem } from '../types';

const EXCLUDED_POSITION_KEYWORDS = [
  'รอง',
  'อุปนายก',
  'ผู้ช่วย',
  'เลขา',
  'ที่ปรึกษา',
  'รักษาการ',
  'ว่าที่',
  'ประธานฝ่าย',
  'ประธานสภา',
  'ประธานชมรม',
  'ประธานกรรมการ',
];

/**
 * ตรวจสอบว่าบุคคลนี้เป็นผู้ดำรงตำแหน่ง "นายกองค์การนักเรียน" เท่านั้น
 * ป้องกันการดึงตำแหน่งอื่นที่มีคำว่า ประธาน หรือ รอง/ผู้ช่วย/ที่ปรึกษานายก มาแสดงผลปะปนกัน
 */
export function isStudentUnionPresident(person: PersonItem): boolean {
  if (person.role === 'advisor') return false;

  const pos = (person.position || '').trim().replace(/\s+/g, ' ');
  if (!pos) return false;

  if (EXCLUDED_POSITION_KEYWORDS.some((keyword) => pos.includes(keyword))) {
    return false;
  }

  return /^นายกองค์การนักเรียน($|\s|\(|\/)/.test(pos);
}

/**
 * คัดกรองและเรียงลำดับรายชื่อสำหรับหน้า "ทำเนียบนายกองค์การนักเรียน"
 * ดึงเฉพาะผู้ดำรงตำแหน่ง นายกองค์การนักเรียน เท่านั้น และตัดรายการชื่อ+ปีซ้ำออก
 */
export function filterHallPresidents(peopleList: PersonItem[]): PersonItem[] {
  const matched = peopleList.filter(isStudentUnionPresident);

  matched.sort((a, b) => {
    const yrDiff = (b.yearTH || '').localeCompare(a.yearTH || '');
    if (yrDiff !== 0) return yrDiff;

    const aHasPhoto = Boolean(a.photo?.url || a.photoUrl);
    const bHasPhoto = Boolean(b.photo?.url || b.photoUrl);
    if (aHasPhoto !== bHasPhoto) return bHasPhoto ? 1 : -1;

    if (a.role !== b.role) return a.role === 'president' ? -1 : 1;

    return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
  });

  // ป้องกันการแสดงซ้ำหากผู้ดูแลเพิ่มบุคคลคนเดียวกันทั้งในแท็บคณะกรรมการและแท็บทำเนียบนายกในปีเดียวกัน
  const seen = new Set<string>();
  return matched.filter((person) => {
    const key = `${(person.yearTH || '').trim()}::${person.name.trim().replace(/\s+/g, ' ')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * ค้นหาผู้ดำรงตำแหน่ง "นายกองค์การนักเรียน" คนปัจจุบันสำหรับส่วน "สารจากนายกองค์การนักเรียน"
 */
export function resolveCurrentPresident(
  peopleList: PersonItem[],
  activeYearTH?: string
): PersonItem | null {
  const candidates = filterHallPresidents(peopleList);
  if (candidates.length === 0) return null;

  if (activeYearTH) {
    const currentYearMatch = candidates.find(
      (person) => (person.yearTH || '').trim() === activeYearTH.trim()
    );
    if (currentYearMatch) return currentYearMatch;
  }

  return candidates[0];
}
