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
      dotColor: 'bg-accent/70',
      textColor: 'text-accent'
    },
    considering: {
      label: 'กำลังพิจารณา',
      dotColor: 'bg-gold',
      textColor: 'text-gold-text'
    },
    in_progress: {
      label: 'กำลังดำเนินการ',
      dotColor: 'bg-accent',
      textColor: 'text-accent'
    },
    resolved: {
      label: 'ดำเนินการเสร็จสิ้น',
      dotColor: 'bg-success',
      textColor: 'text-success'
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
    <span className={`text-[11px] uppercase tracking-[0.16em] font-medium text-gold-text ${className}`}>
      {map[category] || 'ข่าวสาร'}
    </span>
  );
};
