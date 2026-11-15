/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AdvisorGroup, PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { Emblem } from '../../components/common/Emblem';
import { getCachedPeopleSync, loadPeopleList } from '../../lib/publicDataService';
import { ADVISOR_GROUPS, resolveAdvisorGroup } from '../../config/site';

function filterAdvisors(list: PersonItem[]): PersonItem[] {
  return list
    .filter((item) => item.role === 'advisor')
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

export const AboutAdvisors: React.FC = () => {
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
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 text-center max-w-2xl mx-auto space-y-2">
        <SectionEyebrow enText="ADVISORY BOARD" thText="คณะกรรมการที่ปรึกษา" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          คณะกรรมการที่ปรึกษาองค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          บุคลากรโรงเรียนหรือนักเรียนผู้มีประสบการณ์ ซึ่งโรงเรียนแต่งตั้งเพื่อให้คำปรึกษา แนะนำ ดูแล และช่วยเหลือในการดำเนินกิจกรรมขององค์การนักเรียน
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-4 border border-stone-200 rounded-sm">
              <div className="aspect-[4/5] bg-stone-200 rounded-sm" />
              <div className="h-4 bg-stone-200 rounded w-2/3 mx-auto" />
              <div className="h-3 bg-stone-200 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {ADVISOR_GROUPS.map((group, idx) => {
            const members = groupedAdvisors[group.id];
            return (
              <section key={group.id} className="space-y-5">
                <div className="border-b border-[#B8923A]/35 pb-3 flex items-baseline gap-3">
                  <span className="font-serif text-base sm:text-lg font-semibold text-[#9C7A2B] shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-[#2A1245] leading-snug">
                    {group.label}
                  </h2>
                </div>

                {members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
                    {members.map((advisor) => (
                      <div
                        key={advisor.id}
                        className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 sm:p-6 rounded-sm shadow-editorial text-center relative space-y-4 hover:border-[#B8923A] transition-colors"
                      >
                        <CornerBracket position="top-left" />
                        <CornerBracket position="top-right" />
                        <CornerBracket position="bottom-left" />
                        <CornerBracket position="bottom-right" />

                        <div className="w-40 h-48 mx-auto bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
                          {advisor.photo?.url || advisor.photoUrl ? (
                            <img
                              src={advisor.photo?.url || advisor.photoUrl}
                              alt={advisor.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EDE6F5] flex flex-col items-center justify-center p-3 text-stone-400">
                              <Emblem size={44} />
                              <span className="text-[11px] text-[#4B1F7A] mt-2 font-medium text-center">
                                {group.shortLabel}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9C7A2B] font-semibold block mb-1">
                            {advisor.position}
                          </span>
                          <h3 className="font-serif text-lg font-semibold text-[#1B1226]">
                            {advisor.name}
                          </h3>
                          {advisor.grade && (
                            <p className="text-xs text-[#1B1226]/60 mt-0.5">{advisor.grade}</p>
                          )}
                          {advisor.quote && (
                            <p className="text-xs text-[#1B1226]/70 italic mt-2 font-serif">
                              "{advisor.quote}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-[#4B1F7A]/20 rounded-sm bg-white/35 text-xs text-[#1B1226]/60">
                    ยังไม่มีรายชื่อใน{group.shortLabel}
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
