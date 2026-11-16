/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. ภาพรวมระบบ (Dashboard & Overview)
export const DashboardIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" className="text-gold" />
    <rect x="13" y="11" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" className="text-gold" />
  </svg>
);

// 2. จัดการข่าวสาร (News & Publications)
export const NewsIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 5C4 4.44772 4.44772 4 5 4H17C17.5523 4 18 4.44772 18 5V19C18 19.5523 18.4477 20 19 20H20" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 5V19C4 19.5523 4.44772 20 5 20H19" stroke="currentColor" strokeWidth="1.6" />
    <line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-gold" />
    <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 3. ปฏิทินกิจกรรม (Calendar & Events)
export const CalendarIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.4" />
    <line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold" />
    <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold" />
    <circle cx="8" cy="13" r="1.2" fill="currentColor" className="text-gold" />
    <circle cx="12" cy="13" r="1.2" fill="currentColor" />
    <circle cx="16" cy="13" r="1.2" fill="currentColor" />
    <circle cx="8" cy="17" r="1.2" fill="currentColor" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" className="text-gold" />
  </svg>
);

// 4. เอกสารดาวน์โหลด (Downloads & Documents)
export const DocumentIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H10.5L12.5 6.5H18C19.1046 6.5 20 7.39543 20 8.5V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 11V16M12 16L10 14M12 16L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gold" />
  </svg>
);

// 5. บุคลากร / ทำเนียบ (Council Members & Leadership)
export const UsersIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 19C3 15.6863 5.68629 13 9 13C12.3137 13 15 15.6863 15 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15 6.5C15.8284 6.5 16.5 7.17157 16.5 8C16.5 8.82843 15.8284 9.5 15 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-gold" />
    <path d="M17.5 13.5C19.2 14.2 20.5 15.9 20.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-gold" />
  </svg>
);

// 6. งบประมาณกิจกรรม (Finance & Budgets)
export const BudgetIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7V17M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5C13.4 7.5 14.5 8.4 14.5 9.5C14.5 11 12 11.5 12 13M9.5 14.5C9.5 15.6 10.6 16.5 12 16.5C13.4 16.5 14.5 15.6 14.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-gold" />
  </svg>
);

// 7. เรื่องร้องเรียน / เสนอแนะ (Complaints & Suggestions Inbox)
export const ComplaintsIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="text-gold" />
  </svg>
);

// 8. แบนเนอร์หน้าแรก (Hero Banners Manager)
export const BannersIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="7" cy="10" r="1.5" fill="currentColor" className="text-gold" />
    <path d="M4 16L9 11L14 15L17 12L21 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold" />
  </svg>
);

// 9. ตั้งค่าเว็บไซต์ (Site Settings)
export const SettingsIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" className="text-gold" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 10. ผู้ดูแลระบบและสิทธิ์ (Security & RBAC)
export const SecurityIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3L20 6.5V12C20 16.5 16.5 20.5 12 21.5C7.5 20.5 4 16.5 4 12V6.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gold" />
  </svg>
);
