/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type AdminLangMode = 'th' | 'en';

interface AdminLangTabsProps {
  value: AdminLangMode;
  onChange: (lang: AdminLangMode) => void;
  enReady?: boolean;
}

/**
 * แถบสลับภาษา (ภาษาไทยหลัก / ภาษาอังกฤษไม่บังคับ) สำหรับฟอร์มจัดการข้อมูลในหลังบ้าน
 */
export const AdminLangTabs: React.FC<AdminLangTabsProps> = ({
  value,
  onChange,
  enReady = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-surface border border-gold-border/25 rounded-sm">
      <div className="flex items-center gap-1.5" role="tablist" aria-label="เลือกภาษาของข้อมูล">
        <button
          type="button"
          role="tab"
          aria-selected={value === 'th'}
          onClick={() => onChange('th')}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
            value === 'th'
              ? 'bg-brand text-brand-contrast shadow-sm'
              : 'text-text-muted hover:text-heading hover:bg-bg-alt'
          }`}
        >
          ภาษาไทย (หลัก)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === 'en'}
          onClick={() => onChange('en')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
            value === 'en'
              ? 'bg-brand text-brand-contrast shadow-sm'
              : 'text-text-muted hover:text-heading hover:bg-bg-alt'
          }`}
        >
          <span>English (ไม่บังคับ)</span>
          {enReady && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                value === 'en' ? 'bg-anchor-gold' : 'bg-success'
              }`}
              title="มีข้อมูลภาษาอังกฤษแล้ว"
            />
          )}
        </button>
      </div>
      <span className="text-[11px] text-text-muted px-1">
        {value === 'th'
          ? 'ข้อมูลภาษาหลัก ใช้แสดงเสมอและเป็นค่าสำรองหากยังไม่แปล'
          : 'หากเว้นว่าง ระบบจะแสดงข้อความภาษาไทยแทนโดยอัตโนมัติ'}
      </span>
    </div>
  );
};

interface AdminEnStatusBadgeProps {
  translated: boolean;
}

/**
 * ป้ายสถานะแสดงว่าข้อมูลรายการนี้มีคำแปลภาษาอังกฤษแล้วหรือยัง
 */
export const AdminEnStatusBadge: React.FC<AdminEnStatusBadgeProps> = ({ translated }) => {
  if (translated) {
    return (
      <span
        title="มีข้อมูลภาษาอังกฤษแล้ว"
        className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-success-bg text-success border border-success/30 whitespace-nowrap"
      >
        TH + EN
      </span>
    );
  }
  return (
    <span
      title="ยังไม่มีข้อมูลภาษาอังกฤษ (จะแสดงภาษาไทยแทนในหน้า EN)"
      className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-bg-alt text-text-muted border border-gold-border/25 whitespace-nowrap"
    >
      TH เท่านั้น
    </span>
  );
};
