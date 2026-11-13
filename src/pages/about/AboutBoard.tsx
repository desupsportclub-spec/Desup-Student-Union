/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PersonItem } from '../../types';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { Emblem } from '../../components/common/Emblem';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const AboutBoard: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [allBoard, setAllBoard] = useState<PersonItem[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([academicYearTH]);
  const [selectedYear, setSelectedYear] = useState<string>(academicYearTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedYear((prev) => prev || academicYearTH);
  }, [academicYearTH]);

  // Fetch all board members once (avoids composite index dependency)
  useEffect(() => {
    async function fetchBoardData() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'people'));
        const list: PersonItem[] = [];
        const yearsSet = new Set<string>();
        snap.forEach((d) => {
          const data = { id: d.id, ...d.data() } as PersonItem;
          if (data.role === 'board') {
            list.push(data);
            if (data.yearTH) yearsSet.add(data.yearTH);
          }
        });

        yearsSet.add(academicYearTH);
        const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
        setAvailableYears(sortedYears);

        list.sort((a, b) => (a.order || 999) - (b.order || 999));
        setAllBoard(list);

        if (sortedYears.length > 0 && !yearsSet.has(selectedYear)) {
          setSelectedYear(sortedYears[0]);
        }
      } catch (err) {
        console.warn("Could not load board members:", err);
        setAvailableYears([academicYearTH]);
      } finally {
        setLoading(false);
      }
    }

    fetchBoardData();
  }, [academicYearTH]);

  const boardMembers = allBoard.filter((m) => m.yearTH === selectedYear);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText="BOARD & LEADERSHIP" thText="คณะกรรมการองค์การนักเรียน" />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226] mt-2">
            คณะกรรมการองค์การนักเรียน
          </h1>
          <p className="text-xs md:text-sm text-[#1B1226]/70 mt-1">
            คณะกรรมการองค์การนักเรียน ภายใต้การกำกับดูแลของงานกิจการนักเรียน (วาระ ๑ ปีการศึกษา) ประจำปีการศึกษา {selectedYear}
          </p>
        </div>

        {/* Dynamic Academic Year Select Dropdown */}
        {availableYears.length > 0 && (
          <div className="flex items-center gap-2.5 text-xs">
            <label htmlFor="board-year-select" className="text-[#9C7A2B] font-medium whitespace-nowrap">
              ปีการศึกษา:
            </label>
            <select
              id="board-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#B8923A]/50 rounded-sm text-[#2A1245] font-serif font-semibold focus:outline-none focus:border-[#4B1F7A] shadow-editorial-sm"
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
            <div key={i} className="animate-pulse space-y-3 p-3 sm:p-4 border border-stone-200 rounded-sm">
              <div className="aspect-[4/5] bg-stone-200 rounded-sm" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : boardMembers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {boardMembers.map((member) => (
            <div
              key={member.id}
              className="group relative bg-[#FAF7F0] border border-[#4B1F7A]/15 p-3 sm:p-4 rounded-sm shadow-editorial transition-all duration-300 hover:border-[#B8923A]/70 text-center flex flex-col justify-between"
            >
              <CornerBracket position="top-left" />
              <CornerBracket position="top-right" />
              <CornerBracket position="bottom-left" />
              <CornerBracket position="bottom-right" />

              <div>
                <div className="aspect-[4/5] bg-stone-100 rounded-sm overflow-hidden mb-3 sm:mb-4 border border-stone-200">
                  {member.photo?.url || member.photoUrl ? (
                    <img
                      src={member.photo?.url || member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EDE6F5] flex flex-col items-center justify-center p-3 text-stone-400">
                      <Emblem size={36} />
                      <span className="text-[10px] text-[#4B1F7A] mt-2 font-medium">สธ.มพ</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] uppercase tracking-wider text-[#9C7A2B] font-semibold block mb-1">
                  {member.position}
                </span>

                <h3 className="font-serif text-base font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors">
                  {member.name}
                </h3>
              </div>

              {member.grade && (
                <p className="text-[11px] text-[#1B1226]/60 mt-2 pt-2 border-t border-[#4B1F7A]/10">
                  {member.grade}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/40 space-y-2">
          <p className="font-serif text-lg text-[#2A1245]">
            ยังไม่มีข้อมูลคณะกรรมการประจำปีการศึกษา {selectedYear}
          </p>
          <p className="text-xs text-[#1B1226]/60">
            สามารถเพิ่มรายชื่อคณะกรรมการได้ผ่านระบบจัดการผู้ดูแล (Admin Portal)
          </p>
        </div>
      )}
    </div>
  );
};
