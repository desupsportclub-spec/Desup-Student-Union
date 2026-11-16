/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { Emblem } from '../../components/common/Emblem';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getCachedPeopleSync, loadPeopleList } from '../../lib/publicDataService';

export const AboutBoard: React.FC = () => {
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

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText="BOARD & LEADERSHIP" thText="คณะกรรมการองค์การนักเรียน" />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading mt-2">
            คณะกรรมการองค์การนักเรียน
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            คณะกรรมการองค์การนักเรียน ภายใต้การกำกับดูแลของงานกิจการนักเรียน (วาระ ๑ ปีการศึกษา) ประจำปีการศึกษา {selectedYear}
          </p>
        </div>

        {/* Dynamic Academic Year Select Dropdown */}
        {availableYears.length > 0 && (
          <div className="flex items-center gap-2.5 text-xs">
            <label htmlFor="board-year-select" className="text-gold-text font-medium whitespace-nowrap">
              ปีการศึกษา:
            </label>
            <select
              id="board-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-surface-elevated border border-gold-border/50 rounded-sm text-heading font-serif font-semibold focus:outline-none focus:border-gold shadow-editorial-sm"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปีการศึกษา {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Board Members Grid */}
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
          {boardMembers.map((member) => (
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
                  {member.photo?.url || member.photoUrl ? (
                    <img
                      src={member.photo?.url || member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-soft flex flex-col items-center justify-center p-3 text-text-muted">
                      <Emblem size={36} />
                      <span className="text-[10px] text-accent mt-2 font-medium">สธ.มพ</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] uppercase tracking-wider text-gold-text font-semibold block mb-1">
                  {member.position}
                </span>

                <h3 className="font-serif text-base font-semibold text-heading group-hover:text-accent transition-colors">
                  {member.name}
                </h3>
              </div>

              {member.grade && (
                <p className="text-[11px] text-text-muted mt-2 pt-2 border-t border-gold-border/15">
                  {member.grade}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/60 space-y-2">
          <p className="font-serif text-lg text-heading">
            ยังไม่มีข้อมูลคณะกรรมการประจำปีการศึกษา {selectedYear}
          </p>
          <p className="text-xs text-text-muted">
            สามารถเพิ่มรายชื่อคณะกรรมการได้ผ่านระบบจัดการผู้ดูแล (Admin Portal)
          </p>
        </div>
      )}
    </div>
  );
};
