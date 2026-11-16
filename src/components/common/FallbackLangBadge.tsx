/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

interface FallbackLangBadgeProps {
  /** แสดงป้ายเมื่อเนื้อหาถูกสลับกลับไปใช้ต้นฉบับภาษาไทย */
  show: boolean;
  className?: string;
}

/**
 * ป้ายแจ้งแบบนุ่มนวลขนาดกะทัดรัดเมื่อเปิดดูหน้าภาษาอังกฤษแต่รายการนั้นยังไม่มีคำแปลภาษาอังกฤษ
 */
export const FallbackLangBadge: React.FC<FallbackLangBadgeProps> = ({ show, className = '' }) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();

  // แสดงเฉพาะโหมดภาษาอังกฤษและเมื่อตกกลับไปใช้ข้อความต้นฉบับภาษาไทยเท่านั้น
  if (!show || lang !== 'en') return null;

  return (
    <span
      title={t('l10n.thOriginalTitle')}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm bg-bg-alt border border-gold-border/35 text-[10px] font-medium text-text-muted tracking-wide whitespace-nowrap ${className}`}
    >
      {t('l10n.thOriginalBadge')}
    </span>
  );
};

interface UntranslatedBannerProps {
  /** แสดงแถบแจ้งเตือนเมื่อบทความยังไม่มีฉบับแปลภาษาอังกฤษ */
  show: boolean;
}

/**
 * แถบแจ้งสถานะแบบสุภาพด้านบนหน้ารายละเอียดข่าว เมื่อบทความยังไม่มีฉบับแปลภาษาอังกฤษ
 */
export const UntranslatedBanner: React.FC<UntranslatedBannerProps> = ({ show }) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();

  if (!show || lang !== 'en') return null;

  return (
    <div
      role="note"
      className="px-4 py-3 bg-surface border border-gold-border/35 border-l-2 border-l-gold rounded-sm text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2"
    >
      <div>
        <span className="font-semibold text-heading mr-1.5">
          {t('l10n.articleUntranslatedTitle')}:
        </span>
        <span>{t('l10n.articleUntranslatedDesc')}</span>
      </div>
    </div>
  );
};
