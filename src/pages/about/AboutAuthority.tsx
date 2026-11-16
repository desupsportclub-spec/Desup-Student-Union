/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { SeoHead } from '../../components/common/SeoHead';

interface ClauseItem {
  num: string;
  text: string;
}

export const AboutAuthority: React.FC = () => {
  const { t } = useTranslation();
  const duties = t('about.authority.duties', { returnObjects: true }) as ClauseItem[];
  const guidelines = t('about.authority.guidelines', { returnObjects: true }) as ClauseItem[];

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <SeoHead titleKey="seo.pages.authority.title" descriptionKey="seo.pages.authority.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-6 sm:pb-8 text-center max-w-2xl mx-auto space-y-2.5">
        <SectionEyebrow enText={t('about.authority.eyebrowEn')} thText={t('about.authority.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          {t('about.authority.title')}
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          {t('about.authority.subtitle')}
        </p>
      </div>

      {/* ส่วนที่ 1: อำนาจหน้าที่ขององค์การนักเรียน */}
      <section className="bg-surface border border-gold-border/40 p-6 sm:p-8 md:p-10 rounded-sm shadow-editorial relative space-y-6">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="border-b border-gold-border/30 pb-4 flex items-baseline gap-3">
          <span className="font-serif text-sm sm:text-base font-bold text-gold-text shrink-0">
            01
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-accent">
            {t('about.authority.section1Title')}
          </h2>
        </div>

        <ol className="divide-y divide-gold-border/15">
          {Array.isArray(duties) && duties.map((item) => (
            <li
              key={item.num}
              className="py-4 first:pt-1 last:pb-1 flex items-start gap-4 sm:gap-5"
            >
              <span className="w-9 h-8 rounded-sm bg-brand text-brand-contrast border border-gold-border/60 font-serif text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <p className="text-sm sm:text-[15px] text-text leading-relaxed pt-1">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ส่วนที่ 2: แนวทางที่องค์การนักเรียนพึงดำเนิน */}
      <section className="bg-surface border border-gold-border/40 p-6 sm:p-8 md:p-10 rounded-sm shadow-editorial relative space-y-6">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="border-b border-gold-border/30 pb-4 flex items-baseline gap-3">
          <span className="font-serif text-sm sm:text-base font-bold text-gold-text shrink-0">
            02
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-accent">
            {t('about.authority.section2Title')}
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {Array.isArray(guidelines) && guidelines.map((item) => (
            <li
              key={item.num}
              className="p-4 sm:p-5 bg-surface-elevated border border-gold-border/30 rounded-sm flex items-start gap-3.5"
            >
              <span className="w-9 h-8 rounded-sm bg-brand text-brand-contrast border border-gold-border/60 font-serif text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <p className="text-sm sm:text-[15px] text-text leading-relaxed pt-0.5">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
