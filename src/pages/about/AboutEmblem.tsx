/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';

export const AboutEmblem: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="SYMBOL & IDENTITY" thText="ตราสัญลักษณ์และความหมาย" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          สัญลักษณ์องค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
      </div>

      {/* Main Crest Display */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-[#FAF7F0] border border-[#B8923A]/40 rounded-sm shadow-editorial relative">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
          <img
            src="/emblem.png"
            alt="ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-md"
          />
        </div>

        <p className="font-serif text-xl font-bold text-[#2A1245] tracking-wide text-center">
          ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
        <p className="text-xs text-[#9C7A2B] mt-1 font-serif">
          STUDENT UNION · DEMONSTRATION SCHOOL OF UNIVERSITY OF PHAYAO
        </p>
      </div>

      {/* Official Symbolism Description (Verbatim from User) */}
      <div className="bg-white border border-[#4B1F7A]/20 p-8 rounded-sm shadow-editorial space-y-4">
        <div className="flex items-center gap-3 border-b border-[#B8923A]/30 pb-3">
          <span className="text-lg">📜</span>
          <h2 className="font-serif text-xl font-bold text-[#2A1245]">
            คำอธิบายตราสัญลักษณ์ทางการ
          </h2>
        </div>
        <p className="text-sm md:text-base text-[#1B1226]/85 leading-relaxed font-sans indent-8">
          ตราสัญลักษณ์องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา มีลักษณะเป็นรูปสัตตภัณฑ์สีดำ โดดเด่นอยู่บนพื้นหลังรูปวงกลมสีเหลืองคล้ายดวงอาทิตย์ ภายในบริเวณส่วนฐานของสัตตภัณฑ์มีอักษรย่อ “มพ” สีม่วง และมีข้อความภาษาอังกฤษ "STUDENT UNION" สีขาวอยู่เหนืออักษรย่อ โอบล้อมรอบนอกด้วยขอบวงกลมสีดำที่บรรจุชื่อ "Demonstration School . University of Phayao" สีขาว ส่วนด้านล่างสุดมีชื่อภาษาไทย "องค์การนักเรียน" สีดำทาบอยู่บนพื้นแถบโค้งสีขาว
        </p>
      </div>

      {/* Breakdown of Elements */}
      <div className="space-y-6">
        <h2 className="font-serif text-2xl font-semibold text-[#2A1245] border-b border-[#4B1F7A]/15 pb-2">
          องค์ประกอบและความหมายเชิงสัญลักษณ์
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-white border border-[#4B1F7A]/15 rounded-sm space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#4B1F7A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B1226]" />
              รูปสัตตภัณฑ์สีดำ (Sattaphan)
            </h3>
            <p className="text-xs md:text-sm text-[#1B1226]/75 leading-relaxed">
              สัตตภัณฑ์ เชิงเทียนล้านนาอันเป็นเอกลักษณ์ทางศิลปวัฒนธรรม สื่อถึงแสงสว่างแห่งปัญญาและคุณธรรมความดีงามอันเป็นหลักนำใจในการดำเนินงานขององค์การนักเรียน
            </p>
          </div>

          <div className="p-5 bg-white border border-[#B8923A]/30 rounded-sm space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#9C7A2B] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              พื้นหลังวงกลมสีเหลืองคล้ายดวงอาทิตย์
            </h3>
            <p className="text-xs md:text-sm text-[#1B1226]/75 leading-relaxed">
              เปรียบเสมือนแสงอาทิตย์ยามเช้าที่สาดส่องพลัง ความหวัง พลังสร้างสรรค์ และความอบอุ่น เป็นศูนย์รวมของพลังเยาวชนสาธิต มพ.
            </p>
          </div>

          <div className="p-5 bg-white border border-[#4B1F7A]/15 rounded-sm space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#4B1F7A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4B1F7A]" />
              อักษรย่อ “มพ” สีม่วง และ "STUDENT UNION"
            </h3>
            <p className="text-xs md:text-sm text-[#1B1226]/75 leading-relaxed">
              สัญลักษณ์แห่งความภาคภูมิใจในมหาวิทยาลัยพะเยาและโรงเรียนสาธิตมหาวิทยาลัยพะเยา สีม่วงอันสง่างามสื่อถึงความผูกพัน ความจงรักภักดี และความเสียสละของนักเรียน
            </p>
          </div>

          <div className="p-5 bg-white border border-stone-200 rounded-sm space-y-2">
            <h3 className="font-serif text-base font-semibold text-[#2A1245] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              ขอบวงกลมและแถบชื่อ "องค์การนักเรียน"
            </h3>
            <p className="text-xs md:text-sm text-[#1B1226]/75 leading-relaxed">
              แสดงถึงความเป็นหนึ่งเดียวกัน (Unity) ระหว่างโรงเรียน คณาจารย์ และนักเรียนทุกคน โอบล้อมด้วยพันธกิจในการพิทักษ์สิทธิ์และส่งเสริมศักยภาพนักเรียน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
