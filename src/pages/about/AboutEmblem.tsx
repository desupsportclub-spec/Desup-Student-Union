/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { SeoHead } from '../../components/common/SeoHead';

export const AboutEmblem: React.FC = () => {
  const { t } = useTranslation();
  const identityItems = t('about.emblem.items', { returnObjects: true }) as {
    label: string;
    value: string;
  }[];

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <SeoHead titleKey="seo.pages.emblem.title" descriptionKey="seo.pages.emblem.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b-2 border-gold pb-4 space-y-1.5">
        <SectionEyebrow enText={t('about.emblem.eyebrowEn')} thText={t('about.emblem.eyebrowTh')} />
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-accent">
          {t('about.emblem.title')}
        </h1>
      </div>

      {/* โครงสร้าง 2 คอลัมน์: ตราสัญลักษณ์และอัตลักษณ์องค์การ */}
      <div className="bg-surface border border-gold-border/35 p-6 sm:p-10 md:p-12 rounded-sm shadow-editorial relative">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* คอลัมน์ซ้าย: รูปตราสัญลักษณ์ */}
          <div className="md:col-span-6 flex items-center justify-center py-2">
            <img
              src="/emblem.png"
              alt={t('about.emblem.imgAlt')}
              data-emblem="true"
              className="w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain drop-shadow-md transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>

          {/* คอลัมน์ขวา: รายการข้อมูลอัตลักษณ์ */}
          <dl className="md:col-span-6 space-y-4 sm:space-y-5">
            {Array.isArray(identityItems) && identityItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="font-serif text-base sm:text-lg font-bold text-accent leading-snug">
                  {item.label}
                </dt>
                <dd className="text-sm sm:text-[15px] text-text-muted leading-relaxed font-sans">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* คำอธิบายตราสัญลักษณ์อย่างเป็นทางการ */}
      <div className="bg-surface-elevated border border-gold-border/25 p-5 sm:p-8 rounded-sm shadow-editorial space-y-3 sm:space-y-4">
        <div className="border-b border-gold-border/30 pb-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-heading">
            {t('about.emblem.descriptionHeading')}
          </h2>
        </div>
        <p className="text-sm md:text-base text-text leading-relaxed font-sans indent-6 sm:indent-8">
          {t('about.emblem.descriptionText')}
        </p>
      </div>
    </div>
  );
};
