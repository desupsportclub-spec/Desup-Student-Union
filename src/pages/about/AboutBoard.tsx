/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { SeoHead } from '../../components/common/SeoHead';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatAcademicYear } from '../../lib/format';
import { getCachedPeopleSync, loadPeopleList } from '../../lib/publicDataService';
import { pickL10n } from '../../lib/l10n';
import { FallbackLangBadge } from '../../components/common/FallbackLangBadge';

export const AboutBoard: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { academicYearTH } = useSiteSettings();
  const initialPeople = getCachedPeopleSync();
  const [people, setPeople] = useState<PersonItem[]>(initialPeople || []);
  const [selectedYear, setSelectedYear] = useState<string>(academicYearTH);
  const [loading, setLoading] = useState(!initialPeople);

  useEffect(() => {
    setSelectedYear((prev) => prev || academicYearTH);
  }, [academicYearTH]);

  useEffect(() => {
    let active = true;
    loadPeopleList((list) => {
      if (!active) return;
      setPeople(list);
      setLoading(false);
    })
      .catch((err) => {
        console.warn('Could not load board members:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { allBoard, availableYears } = useMemo(() => {
    const yearsSet = new Set<string>();
    const list: PersonItem[] = [];
    people.forEach((data) => {
      if (data.role === 'board') {
        list.push(data);
        if (data.yearTH) yearsSet.add(data.yearTH);
      }
    });
    yearsSet.add(academicYearTH);
    const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    list.sort((a, b) => (a.order || 999) - (b.order || 999));
    return { allBoard: list, availableYears: sortedYears };
  }, [people, academicYearTH]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const boardMembers = allBoard.filter((m) => m.yearTH === selectedYear);

  const displaySelectedYear = formatAcademicYear(selectedYear, lang);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      <SeoHead titleKey="seo.pages.board.title" descriptionKey="seo.pages.board.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText={t('about.board.eyebrowEn')} thText={t('about.board.eyebrowTh')} />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading mt-2">
            {t('about.board.title')}
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            {t('about.board.subtitle', { year: displaySelectedYear })}
          </p>
        </div>

        {/* ตัวเลือกปีการศึกษา */}
        {availableYears.length > 0 && (
          <div className="flex items-center gap-2.5 text-xs">
            <label htmlFor="board-year-select" className="text-gold-text font-medium whitespace-nowrap">
              {t('about.board.yearFilterLabel')}
            </label>
            <select
              id="board-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-surface-elevated border border-gold-border/50 rounded-sm text-heading font-serif font-semibold focus:outline-none focus:border-gold shadow-editorial-sm"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {t('site.academicYearLabel', { year: formatAcademicYear(yr, lang) })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ตารางรายชื่อคณะกรรมการ */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-3 sm:p-4 border border-gold-border/20 rounded-sm bg-surface">
              <div className="aspect-[4/5] bg-bg-alt rounded-sm" />
              <div className="h-4 bg-bg-alt rounded w-2/3" />
              <div className="h-3 bg-bg-alt rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : boardMembers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {boardMembers.map((member) => {
            const nameRes = pickL10n(member.name, member.nameEn, lang);
            const posRes = pickL10n(member.position, member.positionEn, lang);
            const gradeRes = pickL10n(member.grade, member.gradeEn, lang);
            return (
              <div
                key={member.id}
                className="group relative bg-surface border border-gold-border/20 p-3 sm:p-4 rounded-sm shadow-editorial transition-all duration-300 hover:border-gold text-center flex flex-col justify-between"
              >
                <CornerBracket position="top-left" />
                <CornerBracket position="top-right" />
                <CornerBracket position="bottom-left" />
                <CornerBracket position="bottom-right" />

                <div>
                  <div className="aspect-[4/5] bg-bg-alt rounded-sm overflow-hidden mb-3 sm:mb-4 border border-gold-border/20">
                    {(member.photo?.url || member.photoUrl) && (
                      <img
                        src={member.photo?.url || member.photoUrl}
                        alt={nameRes.text}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out"
                      />
                    )}
                  </div>

                  <span className="text-[10px] uppercase tracking-wider text-gold-text font-semibold block mb-1">
                    {posRes.text}
                  </span>

                  <h3 className="font-serif text-base font-semibold text-heading group-hover:text-accent transition-colors">
                    {nameRes.text}
                  </h3>

                  {(nameRes.isFallback || posRes.isFallback) && (
                    <div className="mt-1.5 flex justify-center">
                      <FallbackLangBadge show />
                    </div>
                  )}
                </div>

                {gradeRes.text && (
                  <p className="text-[11px] text-text-muted mt-2 pt-2 border-t border-gold-border/15">
                    {gradeRes.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/60 space-y-2">
          <p className="font-serif text-lg text-heading">
            {t('about.board.emptyTitle', { year: displaySelectedYear })}
          </p>
          <p className="text-xs text-text-muted">
            {t('about.board.emptyHint')}
          </p>
        </div>
      )}
    </div>
  );
};
