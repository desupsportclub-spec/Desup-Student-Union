/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { SeoHead } from '../../components/common/SeoHead';
import { useLanguage } from '../../context/LanguageContext';
import { formatAcademicYear } from '../../lib/format';
import { getCachedPeopleSync, loadPeopleList } from '../../lib/publicDataService';
import { pickL10n } from '../../lib/l10n';
import { FallbackLangBadge } from '../../components/common/FallbackLangBadge';
import { filterHallPresidents } from '../../lib/personRoles';

export const AboutHall: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const initialPeople = getCachedPeopleSync();
  const [presidents, setPresidents] = useState<PersonItem[]>(
    initialPeople ? filterHallPresidents(initialPeople) : []
  );
  const [loading, setLoading] = useState(!initialPeople);

  useEffect(() => {
    let active = true;
    loadPeopleList((list) => {
      if (!active) return;
      setPresidents(filterHallPresidents(list));
      setLoading(false);
    })
      .catch((err) => {
        console.warn('Could not load presidents:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <SeoHead titleKey="seo.pages.hall.title" descriptionKey="seo.pages.hall.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText={t('about.hall.eyebrowEn')} thText={t('about.hall.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          {t('about.hall.title')}
        </h1>
      </div>

      {/* ไทม์ไลน์สลับซ้ายขวาแนวตั้ง */}
      {loading ? (
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-bg-alt rounded-sm" />
          ))}
        </div>
      ) : presidents.length > 0 ? (
        <div className="relative">
          {/* เส้นกลางสีทองของไทม์ไลน์ */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-gold-border/40 -translate-x-1/2" />

          <div className="space-y-6 md:space-y-12">
            {presidents.map((pres, index) => {
              const isEven = index % 2 === 0;
              const formattedYear = pres.yearTH ? formatAcademicYear(pres.yearTH, lang) : '';
              const nameRes = pickL10n(pres.name, pres.nameEn, lang);
              const posRes = pickL10n(pres.position, pres.positionEn, lang);
              const quoteRes = pickL10n(pres.quote, pres.quoteEn, lang);

              return (
                <div
                  key={pres.id}
                  className={`relative flex flex-col md:flex-row items-center gap-6 md:gap-8 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* จุดแสดงปีกลางเส้นไทม์ไลน์ */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-anchor-bg border-2 border-gold items-center justify-center text-[10px] text-anchor-gold font-serif font-bold z-10 shadow-editorial">
                    {formattedYear ? formattedYear.slice(-2) : '•'}
                  </div>

                  {/* การ์ดข้อมูลนายกองค์การ (ครึ่งหน้าจอ) */}
                  <div className="w-full md:w-[45%]">
                    <div className="bg-surface border border-gold-border/20 p-4 sm:p-6 rounded-sm shadow-editorial relative space-y-3 hover:border-gold transition-colors">
                      <CornerBracket position="top-left" />
                      <CornerBracket position="top-right" />
                      <CornerBracket position="bottom-left" />
                      <CornerBracket position="bottom-right" />

                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-24 bg-bg-alt rounded-sm shrink-0 overflow-hidden border border-gold-border/20">
                          {(pres.photo?.url || pres.photoUrl) && (
                            <img
                              src={pres.photo?.url || pres.photoUrl}
                              alt={nameRes.text}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {formattedYear && (
                              <span className="text-[10px] uppercase tracking-wider text-gold-text font-semibold">
                                {t('site.academicYearLabel', { year: formattedYear })}
                              </span>
                            )}
                            <FallbackLangBadge show={nameRes.isFallback || posRes.isFallback} />
                          </div>
                          <h3 className="font-serif text-lg font-semibold text-heading">
                            {nameRes.text}
                          </h3>
                          <p className="text-xs text-accent font-medium">
                            {posRes.text || t('about.hall.roleFallback')}
                          </p>
                        </div>
                      </div>

                      {quoteRes.text && (
                        <p className="text-xs text-text-muted italic pt-2 border-t border-gold-border/15 font-serif leading-relaxed">
                          "{quoteRes.text}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* พื้นที่ว่างฝั่งตรงข้ามเพื่อความสมดุลบนเดสก์ท็อป */}
                  <div className="hidden md:block w-[45%]" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/60 space-y-2">
          <p className="font-serif text-lg text-heading">
            {t('about.hall.emptyTitle')}
          </p>
          <p className="text-xs text-text-muted">
            {t('about.hall.emptyHint')}
          </p>
        </div>
      )}
    </div>
  );
};
