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

export const AboutAdvisors: React.FC = () => {
  const [advisors, setAdvisors] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdvisors() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'people'));
        const list: PersonItem[] = [];
        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() } as PersonItem;
          if (item.role === 'advisor') {
            list.push(item);
          }
        });
        list.sort((a, b) => (a.order || 999) - (b.order || 999));
        setAdvisors(list);
      } catch (err) {
        console.warn("Could not load advisors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisors();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="FACULTY ADVISORS" thText="ครูที่ปรึกษาองค์การนักเรียน" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          คณะกรรมการที่ปรึกษาองค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          บุคลากรโรงเรียนหรือนักเรียนผู้มีประสบการณ์ ซึ่งโรงเรียนแต่งตั้งเพื่อให้คำปรึกษา แนะนำ ดูแล และช่วยเหลือในการดำเนินกิจกรรมขององค์การนักเรียน
        </p>
      </div>

      {/* Advisors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-3 p-4 border border-stone-200 rounded-sm">
              <div className="aspect-[4/5] bg-stone-200 rounded-sm" />
              <div className="h-4 bg-stone-200 rounded w-2/3 mx-auto" />
              <div className="h-3 bg-stone-200 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : advisors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {advisors.map((advisor) => (
            <div
              key={advisor.id}
              className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-6 rounded-sm shadow-editorial text-center relative space-y-4 hover:border-[#B8923A] transition-colors"
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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#EDE6F5] flex flex-col items-center justify-center p-3 text-stone-400">
                    <Emblem size={44} />
                    <span className="text-xs text-[#4B1F7A] mt-2 font-medium">อาจารย์ที่ปรึกษา</span>
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
        <div className="p-16 text-center border border-dashed border-[#4B1F7A]/25 rounded-sm bg-white/40 space-y-2">
          <p className="font-serif text-lg text-[#2A1245]">
            ยังไม่มีข้อมูลอาจารย์ที่ปรึกษาในขณะนี้
          </p>
          <p className="text-xs text-[#1B1226]/60">
            สามารถเพิ่มรายชื่อที่ปรึกษาได้ผ่านหน้าผู้ดูแลระบบ
          </p>
        </div>
      )}
    </div>
  );
};
