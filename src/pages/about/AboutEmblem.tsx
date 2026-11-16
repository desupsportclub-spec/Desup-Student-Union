/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';
import { EMBLEM_DESCRIPTION } from '../../config/site';

const IDENTITY_ITEMS = [
  {
    label: 'ชื่อภาษาไทย',
    value: '“องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา”',
  },
  {
    label: 'ชื่อภาษาอังกฤษ',
    value: '“Demonstration School of University of Phayao Student Union”',
  },
  {
    label: 'อักษรย่อ (ภาษาไทย)',
    value: '“อน.สธ.มพ.”',
  },
  {
    label: 'อักษรย่อ (ภาษาอังกฤษ)',
    value: '“DeSUP SU”',
  },
  {
    label: 'ปณิธาน',
    value: '“ส่งเสริมอัตลักษณ์ พิทักษ์สิทธินักเรียน”',
  },
  {
    label: 'วิสัยทัศน์',
    value: '“ขับเคลื่อนกิจกรรมส่งเสริมอัตลักษณ์อย่างสร้างสรรค์ พิทักษ์รักษาไว้ซึ่งสิทธิของนักเรียน”',
  },
];

export const AboutEmblem: React.FC = () => {
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header matching editorial & reference layout */}
      <div className="border-b-2 border-[#B8923A] pb-4 space-y-1.5">
        <SectionEyebrow enText="SYMBOL & IDENTITY" thText="ตราสัญลักษณ์" />
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#4B1F7A]">
          ตราสัญลักษณ์องค์การนักเรียน
        </h1>
      </div>

      {/* Main 2-column Emblem + Identity Spec Layout (matching reference screenshot) */}
      <div className="bg-[#FAF7F0] border border-[#B8923A]/35 p-6 sm:p-10 md:p-12 rounded-sm shadow-editorial relative">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Left column: Emblem Image */}
          <div className="md:col-span-6 flex items-center justify-center py-2">
            <img
              src="/emblem.png"
              alt="ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
              className="w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain drop-shadow-md transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>

          {/* Right column: Structured Identity Fields */}
          <dl className="md:col-span-6 space-y-4 sm:space-y-5">
            {IDENTITY_ITEMS.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="font-serif text-base sm:text-lg font-bold text-[#4B1F7A] leading-snug">
                  {item.label}
                </dt>
                <dd className="text-sm sm:text-[15px] text-[#1B1226]/75 leading-relaxed font-sans">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Official Symbolism Description */}
      <div className="bg-white border border-[#4B1F7A]/20 p-5 sm:p-8 rounded-sm shadow-editorial space-y-3 sm:space-y-4">
        <div className="border-b border-[#B8923A]/30 pb-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A1245]">
            คำอธิบายตราสัญลักษณ์
          </h2>
        </div>
        <p className="text-sm md:text-base text-[#1B1226]/85 leading-relaxed font-sans indent-6 sm:indent-8">
          {EMBLEM_DESCRIPTION}
        </p>
      </div>
    </div>
  );
};
