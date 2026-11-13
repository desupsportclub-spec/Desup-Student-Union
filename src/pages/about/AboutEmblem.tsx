/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';

export const AboutEmblem: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="SYMBOL & IDENTITY" thText="ตราสัญลักษณ์และความหมาย" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          สัญลักษณ์องค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
      </div>

      {/* Main Crest Display */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-[#FAF7F0] border border-[#B8923A]/40 rounded-sm shadow-editorial relative">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="mb-5 sm:mb-6 transform hover:scale-105 transition-transform duration-500">
          <img
            src="/emblem.png"
            alt="ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
            className="w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-md"
          />
        </div>

        <p className="font-serif text-lg sm:text-xl font-bold text-[#2A1245] tracking-wide text-center">
          ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
        <p className="text-[11px] sm:text-xs text-[#9C7A2B] mt-1 font-serif text-center">
          STUDENT UNION · DEMONSTRATION SCHOOL OF UNIVERSITY OF PHAYAO
        </p>
      </div>

      {/* Official Symbolism Description */}
      <div className="bg-white border border-[#4B1F7A]/20 p-5 sm:p-8 rounded-sm shadow-editorial space-y-3 sm:space-y-4">
        <div className="border-b border-[#B8923A]/30 pb-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A1245]">
            คำอธิบายตราสัญลักษณ์ทางการ
          </h2>
        </div>
        <p className="text-sm md:text-base text-[#1B1226]/85 leading-relaxed font-sans indent-6 sm:indent-8">
          ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา มีลักษณะเป็นรูปสัตตภัณฑ์สีดำ โดดเด่นอยู่บนพื้นหลังรูปวงกลมสีเหลืองคล้ายดวงอาทิตย์ ภายในบริเวณส่วนฐานของสัตตภัณฑ์มีอักษรย่อ “มพ” สีม่วง และมีข้อความภาษาอังกฤษ "STUDENT UNION" สีขาวอยู่เหนืออักษรย่อ โอบล้อมรอบนอกด้วยขอบวงกลมสีดำที่บรรจุชื่อ "Demonstration School . University of Phayao" สีขาว ส่วนด้านล่างสุดมีชื่อภาษาไทย "องค์การนักเรียน" สีดำทาบอยู่บนพื้นแถบโค้งสีขาว
        </p>
      </div>
    </div>
  );
};
