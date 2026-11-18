/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdvisorGroup, NewsItem, PersonItem, RegulationSubType } from '../types';

export interface SiteConfig {
  name: string;
  shortName: string;
  schoolName: string;
  description: string;
  currentAcademicYearTH: string; // e.g., 2569
  // เปลี่ยนเป็นไฟล์ตราจริงได้ที่นี่ (เช่น "/emblem.png" หรือ URL ภายนอก)
  emblemUrl: string;
  // อีเมลเริ่มต้นที่จะได้รับสิทธิ์ Super Admin ทันทีที่ล็อกอินครั้งแรก
  bootstrapAdmins: string[];
  contact: {
    address: string;
    phone: string;
    email: string;
    facebook: string;
    facebookUrl: string;
    instagram: string;
    instagramUrl: string;
    mapIframeUrl: string;
  };
  imageProvider: 'direct_base64' | 'cloudinary' | 'firebase';
  cloudinary: {
    cloudName: string;
    uploadPreset: string;
  };
}

export const SITE_CONFIG: SiteConfig = {
  name: "องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
  shortName: "สธ.มพ",
  schoolName: "โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
  description: "ศูนย์รวมข้อมูลข่าวสาร ปฏิทินกิจกรรม เอกสารดาวน์โหลด และช่องทางรับเรื่องร้องเรียนขององค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
  currentAcademicYearTH: "2569",

  // ตราสัญลักษณ์จริงขององค์การนักเรียน
  emblemUrl: "/emblem.png",

  // [รายชื่อ Super Admin ตั้งต้น]: อีเมล Google ที่ได้รับสิทธิ์บริหารจัดการระบบทันที
  bootstrapAdmins: [
    "desupsportclub@gmail.com"
  ],

  contact: {
    address: "โรงเรียนสาธิตมหาวิทยาลัยพะเยา 19 หมู่ 2 ตำบลแม่กา อำเภอเมืองพะเยา จังหวัดพะเยา 56000",
    phone: "054-466-666",
    email: "satit.su@up.ac.th",
    facebook: "องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
    facebookUrl: "https://www.facebook.com/profile.php?id=61591508559552",
    instagram: "@satitup.council",
    instagramUrl: "https://www.instagram.com/",
    // พิกัดโรงเรียนสาธิตมหาวิทยาลัยพะเยา (19.030588, 99.897452)
    mapIframeUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.378950005707!2d99.8948771752033!3d19.030588082163934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30d832c32cfcbcf1%3A0x67db240ef4ff3045!2z4LmC4Lij4LiH4LmA4Lij4Li14Lii4LiZ4Liq4Liy4LiY4Li04LiV4Lih4Lir4Liy4Lin4Li04LiX4Lii4Liy4Lil4Lix4Lii4Lie4Liw4LmA4Lii4Liy!5e0!3m2!1sth!2sth!4v1700000000000!5m2!1sth!2sth"
  },

  // ค่าเริ่มต้นใช้ direct_base64 เพื่อให้ผู้ใช้สามารถอัปโหลดรูปภาพลงฐานข้อมูลได้ทันทีโดยไม่ต้องผูกบัตรเครดิต
  // หรือสลับเป็น 'cloudinary' หรือ 'firebase' ได้
  imageProvider: 'direct_base64',

  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
  }
};

export const RELATED_SYSTEM_LINKS = [
  {
    title: "ระบบบริหารงานวิชาการ",
    description: "ระบบบริการข้อมูลวิชาการ โรงเรียนสาธิตมหาวิทยาลัยพะเยา",
    url: "https://academic.satit.up.ac.th/",
    external: true
  },
  {
    title: "ระบบบริหารงานกิจการนักเรียน",
    description: "ระบบดูแลช่วยเหลือนักเรียนและกิจกรรมพัฒนาผู้เรียน",
    url: "https://student-affairs.satit.up.ac.th",
    external: true
  },
  {
    title: "เพจ Facebook องค์การนักเรียน",
    description: "ติดตามข่าวสารและกิจกรรมผ่านเพจทางการ",
    url: "https://www.facebook.com/profile.php?id=61591508559552",
    external: true
  }
];

export const EMBLEM_DESCRIPTION = "ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา มีลักษณะเป็นรูปสัตตภัณฑ์สีดำ โดดเด่นอยู่บนพื้นหลังรูปวงกลมสีเหลืองคล้ายดวงอาทิตย์ ภายในบริเวณส่วนฐานของสัตตภัณฑ์มีอักษรย่อ “มพ” สีม่วง และมีข้อความภาษาอังกฤษ \"STUDENT UNION\" สีขาวอยู่เหนืออักษรย่อ โอบล้อมรอบนอกด้วยขอบวงกลมสีดำที่บรรจุชื่อ \"Demonstration School . University of Phayao\" สีขาว ส่วนด้านล่างสุดมีชื่อภาษาไทย \"องค์การนักเรียน\" สีดำทาบอยู่บนพื้นแถบโค้งสีขาว";

export const DOWNLOAD_CATEGORIES = [
  { id: 'student', label: 'สำหรับนักเรียน' },
  { id: 'staff', label: 'สำหรับเจ้าหน้าที่' },
] as const;

export function normalizeDownloadCategory(category: string): 'student' | 'staff' {
  if (
    category === 'staff' ||
    category === 'order' ||
    category === 'official_letter' ||
    category === 'meeting_report' ||
    category === 'project_report' ||
    category === 'finance'
  ) {
    return 'staff';
  }
  return 'student';
}

export function getDownloadCategoryLabel(category: string): string {
  const normalized = normalizeDownloadCategory(category);
  const found = DOWNLOAD_CATEGORIES.find((c) => c.id === normalized);
  return found ? found.label : 'สำหรับนักเรียน';
}

export const ADVISOR_GROUPS: { id: AdvisorGroup; label: string; shortLabel: string }[] = [
  {
    id: 'executive',
    label: 'คณะกรรมการฝ่ายอำนวยการ',
    shortLabel: 'ฝ่ายอำนวยการ',
  },
  {
    id: 'teacher',
    label: 'คณะกรรมการที่ปรึกษาองค์การนักเรียน ฝ่าย อาจารย์ที่ปรึกษาองค์การนักเรียน',
    shortLabel: 'ฝ่ายอาจารย์ที่ปรึกษาองค์การนักเรียน',
  },
  {
    id: 'experienced_student',
    label: 'คณะกรรมการที่ปรึกษาองค์การนักเรียน ฝ่าย นักเรียนผู้มีประสบการณ์',
    shortLabel: 'ฝ่ายนักเรียนผู้มีประสบการณ์',
  },
];

export function resolveAdvisorGroup(person: Pick<PersonItem, 'advisorGroup' | 'position'>): AdvisorGroup {
  if (
    person.advisorGroup === 'executive' ||
    person.advisorGroup === 'teacher' ||
    person.advisorGroup === 'experienced_student'
  ) {
    return person.advisorGroup;
  }
  const pos = (person.position || '').toLowerCase();
  if (pos.includes('อำนวยการ') || pos.includes('ผู้อำนวยการ')) {
    return 'executive';
  }
  if (pos.includes('นักเรียน') || pos.includes('ผู้มีประสบการณ์') || pos.includes('ศิษย์เก่า')) {
    return 'experienced_student';
  }
  return 'teacher';
}

export function getAdvisorGroupLabel(group: AdvisorGroup, short = false): string {
  const found = ADVISOR_GROUPS.find((g) => g.id === group);
  if (!found) return ADVISOR_GROUPS[1].label;
  return short ? found.shortLabel : found.label;
}

export const REGULATION_SUBTYPES: { id: RegulationSubType; label: string; labelEn: string }[] = [
  { id: 'bylaw', label: 'ข้อบังคับ', labelEn: 'Bylaws' },
  { id: 'rule', label: 'ระเบียบ', labelEn: 'Regulations' },
  { id: 'order', label: 'คำสั่ง', labelEn: 'Orders' },
  { id: 'announcement', label: 'ประกาศ', labelEn: 'Announcements' },
];

export function resolveRegulationSubType(
  item: Pick<NewsItem, 'category' | 'regulationType' | 'title' | 'titleEn'>
): RegulationSubType | null {
  if (
    item.regulationType === 'bylaw' ||
    item.regulationType === 'rule' ||
    item.regulationType === 'order' ||
    item.regulationType === 'announcement'
  ) {
    return item.regulationType;
  }
  if (item.category === 'order') return 'order';
  const title = `${item.title || ''} ${item.titleEn || ''}`.toLowerCase();
  if (title.includes('ข้อบังคับ') || title.includes('bylaw') || title.includes('charter')) return 'bylaw';
  if (title.includes('ระเบียบ') || title.includes('regulation') || title.includes('rule')) return 'rule';
  if (title.includes('คำสั่ง') || title.includes('order')) return 'order';
  if (title.includes('ประกาศ') || title.includes('announcement') || title.includes('notice')) return 'announcement';
  return null;
}
