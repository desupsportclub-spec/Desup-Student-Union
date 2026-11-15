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
}

export interface NewsItem {
  id?: string;
  title: string;
  slug: string;
  category: NewsCategory;
  excerpt: string;
  content: string; // Tiptap HTML
  coverImage?: ImageAsset;
  coverUrl?: string; // backwards compatibility
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
  description: string;
  type: EventType;
  location: string;
  startAt: string; // ISO date string
  endAt?: string;
  allDay: boolean;
  coverImage?: ImageAsset;
  coverUrl?: string;
  published: boolean;
}

export type DownloadCategory =
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
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export type PersonRole = 'board' | 'advisor' | 'president';

export interface PersonItem {
  id?: string;
  name: string;
  role: PersonRole;
  position: string;
  grade?: string; // e.g. มัธยมศึกษาปีที่ 6/1
  yearTH: string; // e.g. 2569
  photo?: ImageAsset;
  photoUrl?: string;
  quote?: string;
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

export interface BudgetItemEntry {
  activity: string;
  date: string;
  requested: number;
  approved: number;
  spent: number;
}

export interface BudgetYear {
  id?: string; // yearTH, e.g. 2569
  yearTH: string;
  totalBudget: number;
  items: BudgetItemEntry[];
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
  description: string;
  url: string;
  external: boolean;
}

export interface SiteContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  facebookUrl?: string;
}

export interface SiteSettings {
  academicYearTH?: string;
  presidentHeadline?: string;
  presidentMessage?: string;
  ticker: string[];
  links: ServiceLink[];
  contactInfo?: SiteContactInfo;
  totalVisits: number;
  statsOverride?: {
    complaintsCount?: number;
    eventsCount?: number;
  };
}
