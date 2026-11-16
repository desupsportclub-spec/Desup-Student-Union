/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageAsset {
  url: string;
  width?: number;
  height?: number;
  alt: string;
}

export type NewsCategory = 'pr' | 'activity' | 'regulation' | 'order' | 'knowledge' | 'video';

export interface NewsAttachment {
  name: string;
  url: string;
}

export type SocialPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'other';

export interface SocialMediaLink {
  platform: SocialPlatform;
  url: string;
  label?: string;
  labelEn?: string;
}

export interface NewsItem {
  id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  category: NewsCategory;
  excerpt: string;
  excerptEn?: string;
  content: string; // เนื้อหา Tiptap HTML ภาษาไทย
  contentEn?: string; // เนื้อหา Tiptap HTML ภาษาอังกฤษ (ไม่บังคับ)
  coverImage?: ImageAsset;
  coverUrl?: string; // รองรับข้อมูลเดิม
  gallery?: ImageAsset[];
  galleryUrls?: string[];
  attachments?: NewsAttachment[];
  videoUrl?: string;
  socialLinks?: SocialMediaLink[];
  published: boolean;
  pinned: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'sport' | 'academic' | 'art' | 'volunteer' | 'meeting';

export interface EventItem {
  id?: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  type: EventType;
  location: string;
  locationEn?: string;
  startAt: string; // ISO date string
  endAt?: string;
  allDay: boolean;
  coverImage?: ImageAsset;
  coverUrl?: string;
  published: boolean;
}

export type DownloadAudience = 'student' | 'staff';

export type DownloadCategory =
  | DownloadAudience
  | 'order'
  | 'announcement'
  | 'regulation'
  | 'official_letter'
  | 'meeting_report'
  | 'project_report'
  | 'finance'
  | 'form'
  | 'manual'
  | 'other';
export type FileExtensionType = 'pdf' | 'docx' | 'xlsx';

export interface DownloadItem {
  id?: string;
  title: string;
  titleEn?: string;
  category: DownloadCategory;
  fileType: FileExtensionType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  isChunked?: boolean;
  chunkCount?: number;
  downloads: number;
  createdAt: string;
}

export interface BannerItem {
  id?: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export type PersonRole = 'board' | 'advisor' | 'president';

export type AdvisorGroup = 'executive' | 'teacher' | 'experienced_student';

export interface PersonItem {
  id?: string;
  name: string;
  nameEn?: string;
  role: PersonRole;
  advisorGroup?: AdvisorGroup;
  position: string;
  positionEn?: string;
  grade?: string; // เช่น มัธยมศึกษาปีที่ 6/1
  gradeEn?: string; // เช่น M.6/1
  yearTH: string; // เช่น 2569
  photo?: ImageAsset;
  photoUrl?: string;
  quote?: string;
  quoteEn?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ComplaintType = 'complaint' | 'corruption' | 'inquiry' | 'suggestion' | 'compliment' | 'other';
export type ComplaintStatus = 'received' | 'considering' | 'in_progress' | 'resolved';

export interface PublicReply {
  text: string;
  at: string; // ISO timestamp
  by?: string;
}

export interface ComplaintItem {
  id?: string; // tracking code, e.g. SC-2569-ABCDEF
  trackingCode: string;
  type: ComplaintType;
  title: string;
  body: string;
  location?: string;
  anonymous: boolean;
  reporterUid?: string;
  status: ComplaintStatus;
  publicReplies?: PublicReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintPrivateContact {
  name?: string;
  gradeClass?: string;
  contactMethod?: string; // email, line, phone
}

export interface ComplaintPrivateAttachment {
  images: ImageAsset[];
}

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface AdminUser {
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  addedBy: string;
  addedAt: string;
}

export interface AuditLogItem {
  id?: string;
  action: 'grant' | 'change_role' | 'revoke';
  targetEmail: string;
  fromRole?: string;
  toRole?: string;
  byEmail: string;
  at: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface ServiceLink {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  url: string;
  external: boolean;
}

export interface SiteContactInfo {
  address?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  facebookEn?: string;
  facebookUrl?: string;
}

export interface ComplaintStatsSummary {
  total: number;
  inProgress: number;
  resolved: number;
}

export interface SiteSettings {
  academicYearTH?: string;
  presidentHeadline?: string;
  presidentHeadlineEn?: string;
  presidentMessage?: string;
  presidentMessageEn?: string;
  ticker: string[];
  tickerEn?: string[];
  links: ServiceLink[];
  contactInfo?: SiteContactInfo;
  totalVisits: number;
  complaintStats?: ComplaintStatsSummary;
  statsOverride?: {
    complaintsCount?: number;
    eventsCount?: number;
  };
}
