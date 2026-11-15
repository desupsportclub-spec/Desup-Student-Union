/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComplaintStatus, NewsCategory } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const ComplaintStatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const config: Record<ComplaintStatus, { label: string; dotColor: string; textColor: string }> = {
    received: {
      label: 'รับเรื่องแล้ว',
      dotColor: 'bg-[#6B3FA0]/70',
      textColor: 'text-[#4B1F7A]'
    },
    considering: {
      label: 'กำลังพิจารณา',
      dotColor: 'bg-[#B8923A]',
      textColor: 'text-[#9C7A2B]'
    },
    in_progress: {
      label: 'กำลังดำเนินการ',
      dotColor: 'bg-[#6B3FA0]',
      textColor: 'text-[#4B1F7A]'
    },
    resolved: {
      label: 'ดำเนินการเสร็จสิ้น',
      dotColor: 'bg-[#2F6B4F]',
      textColor: 'text-[#2F6B4F]'
    }
  };

  const item = config[status] || config.received;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide ${item.textColor} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
      <span>{item.label}</span>
    </span>
  );
};

export const NewsCategoryBadge: React.FC<{ category: NewsCategory; className?: string }> = ({ category, className = "" }) => {
  const map: Record<NewsCategory, string> = {
    pr: 'ข่าวประชาสัมพันธ์',
    activity: 'ภาพข่าวกิจกรรม',
    regulation: 'ข้อบังคับ ระเบียบ คำสั่งและประกาศ',
    order: 'ข้อบังคับ ระเบียบ คำสั่งและประกาศ',
    knowledge: 'สาระน่ารู้',
    video: 'คลิปวิดีโอ'
  };

  return (
    <span className={`text-[11px] uppercase tracking-[0.16em] font-medium text-[#9C7A2B] ${className}`}>
      {map[category] || 'ข่าวสาร'}
    </span>
  );
};
