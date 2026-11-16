/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdvisorGroup, PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { Emblem } from '../../components/common/Emblem';
import { SeoHead } from '../../components/common/SeoHead';
import { getCachedPeopleSync, loadPeopleList } from '../../lib/publicDataService';
import { ADVISOR_GROUPS, resolveAdvisorGroup } from '../../config/site';
import { useLanguage } from '../../context/LanguageContext';
import { pickL10n } from '../../lib/l10n';
import { FallbackLangBadge } from '../../components/common/FallbackLangBadge';

function filterAdvisors(list: PersonItem[]): PersonItem[] {
  return list
    .filter((item) => item.role === 'advisor')
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

export const AboutAdvisors: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const initialPeople = getCachedPeopleSync();
  const [advisors, setAdvisors] = useState<PersonItem[]>(
    initialPeople ? filterAdvisors(initialPeople) : []
  );
  const [loading, setLoading] = useState(!initialPeople);

  useEffect(() => {
    let active = true;
    loadPeopleList((list) => {
      if (!active) return;
      setAdvisors(filterAdvisors(list));
      setLoading(false);
    })
      .catch((err) => {
        console.warn('Could not load advisors:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const groupedAdvisors = useMemo(() => {
    const groups: Record<AdvisorGroup, PersonItem[]> = {
      executive: [],
      teacher: [],
      experienced_student: [],
    };
    for (const person of advisors) {
      const grp = resolveAdvisorGroup(person);
      groups[grp].push(person);
    }
    return groups;
  }, [advisors]);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <SeoHead titleKey="seo.pages.advisors.title" descriptionKey="seo.pages.advisors.desc" />

      {/* ส่วนหัวหน้า */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-2xl mx-auto space-y-2">
        <SectionEyebrow enText={t('about.advisors.eyebrowEn')} thText={t('about.advisors.eyebrowTh')} />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          {t('about.advisors.title')}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-4 border border-gold-border/20 rounded-sm bg-surface">
              <div className="aspect-[4/5] bg-bg-alt rounded-sm" />
              <div className="h-4 bg-bg-alt rounded w-2/3 mx-auto" />
              <div className="h-3 bg-bg-alt rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {ADVISOR_GROUPS.map((group, idx) => {
            const members = groupedAdvisors[group.id];
            const groupLabel = t(`about.advisors.groups.${group.id}.label`);
            const groupShortLabel = t(`about.advisors.groups.${group.id}.shortLabel`);

            return (
              <section key={group.id} className="space-y-5">
                <div className="border-b border-gold-border/35 pb-3 flex items-baseline gap-3">
                  <span className="font-serif text-base sm:text-lg font-semibold text-gold-text shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-heading leading-snug">
                    {groupLabel}
                  </h2>
                </div>

                {members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
                    {members.map((advisor) => {
                      const nameRes = pickL10n(advisor.name, advisor.nameEn, lang);
                      const posRes = pickL10n(advisor.position, advisor.positionEn, lang);
                      const gradeRes = pickL10n(advisor.grade, advisor.gradeEn, lang);
                      const quoteRes = pickL10n(advisor.quote, advisor.quoteEn, lang);
                      return (
                        <div
                          key={advisor.id}
                          className="bg-surface border border-gold-border/20 p-5 sm:p-6 rounded-sm shadow-editorial text-center relative space-y-4 hover:border-gold transition-colors"
                        >
                          <CornerBracket position="top-left" />
                          <CornerBracket position="top-right" />
                          <CornerBracket position="bottom-left" />
                          <CornerBracket position="bottom-right" />

                          <div className="w-40 h-48 mx-auto bg-bg-alt rounded-sm overflow-hidden border border-gold-border/20">
                            {advisor.photo?.url || advisor.photoUrl ? (
                              <img
                                src={advisor.photo?.url || advisor.photoUrl}
                                alt={nameRes.text}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-soft flex flex-col items-center justify-center p-3 text-text-muted">
                                <Emblem size={44} />
                                <span className="text-[11px] text-accent mt-2 font-medium text-center">
                                  {groupShortLabel}
                                </span>
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gold-text font-semibold block mb-1">
                              {posRes.text}
                            </span>
                            <h3 className="font-serif text-lg font-semibold text-heading">
                              {nameRes.text}
                            </h3>
                            {gradeRes.text && (
                              <p className="text-xs text-text-muted mt-0.5">{gradeRes.text}</p>
                            )}
                            {quoteRes.text && (
                              <p className="text-xs text-text-muted italic mt-2 font-serif">
                                "{quoteRes.text}"
                              </p>
                            )}
                            {(nameRes.isFallback || posRes.isFallback) && (
                              <div className="mt-2 flex justify-center">
                                <FallbackLangBadge show />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-gold-border/25 rounded-sm bg-surface/60 text-xs text-text-muted">
                    {t('about.advisors.emptyGroup', { group: groupShortLabel })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
