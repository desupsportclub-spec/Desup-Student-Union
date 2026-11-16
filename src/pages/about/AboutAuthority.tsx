/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectionEyebrow, CornerBracket } from '../../components/common/Ornament';

const DUTIES = [
  {
    num: '(๑)',
    text: 'รักษาผลประโยชน์และสิทธิอันชอบธรรมของนักเรียนในเรื่องเกี่ยวกับกิจการนักเรียน',
  },
  {
    num: '(๒)',
    text: 'บริหารกิจกรรมที่เกี่ยวกับองค์การนักเรียน ให้เป็นไปตามนโยบายที่ได้แถลงไว้ ซึ่งไม่ขัดข้อบังคับ ระเบียบ ประกาศ นโยบายของโรงเรียน',
  },
  {
    num: '(๓)',
    text: 'ปฏิบัติงานอื่น ๆ ตามที่โรงเรียนมอบหมาย',
  },
];

const GUIDELINES = [
  {
    num: '(๑)',
    text: 'รักษาไว้ซึ่งผลประโยชน์ส่วนรวมของนักเรียน',
  },
  {
    num: '(๒)',
    text: 'รักษาไว้ซึ่งประสิทธิภาพในการขับเคลื่อนการดำเนินกิจกรรมนักเรียน',
  },
  {
    num: '(๓)',
    text: 'ยึดมั่นและศรัทธาในการปกครองของระบบประชาธิปไตย',
  },
  {
    num: '(๔)',
    text: 'ยึดมั่นในข้อบังคับ ระเบียบ ประกาศ คำสั่ง และนโยบายของโรงเรียนอย่างเคร่งครัด',
  },
  {
    num: '(๕)',
    text: 'เป็นผู้ส่งเสริมกิจกรรมเสริมหลักสูตร ตามอัตลักษณ์นักเรียนของโรงเรียน รักษาไว้ซึ่งศิลปะและวัฒนธรรมของชาติ ทำนุบำรุง อนุรักษ์ ฟื้นฟู สืบสานสร้างสรรค์',
  },
  {
    num: '(๖)',
    text: 'เป็นผู้มีความซื่อสัตย์ สุจริต บริหารงานอย่างโปร่งใส ใฝ่เรียนรู้และกระตือรือร้น',
  },
  {
    num: '(๗)',
    text: 'มีความเป็นผู้นำและผู้ตามที่ดี',
  },
  {
    num: '(๘)',
    text: 'เผยแพร่ชื่อเสียงและเกียรติคุณของโรงเรียน',
  },
];

export const AboutAuthority: React.FC = () => {
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="border-b border-gold-border/30 pb-6 sm:pb-8 text-center max-w-2xl mx-auto space-y-2.5">
        <SectionEyebrow enText="CHARTER & POWERS" thText="อำนาจหน้าที่" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          อำนาจหน้าที่องค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          ตามประกาศโรงเรียนสาธิตมหาวิทยาลัยพะเยา เรื่อง องค์การนักเรียน พ.ศ. ๒๕๖๙
        </p>
      </div>

      {/* Section 1: อำนาจหน้าที่ขององค์การนักเรียน */}
      <section className="bg-surface border border-gold-border/40 p-6 sm:p-8 md:p-10 rounded-sm shadow-editorial relative space-y-6">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="border-b border-gold-border/30 pb-4 flex items-baseline gap-3">
          <span className="font-serif text-sm sm:text-base font-bold text-gold-text shrink-0">
            01
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-accent">
            อำนาจหน้าที่ขององค์การนักเรียน
          </h2>
        </div>

        <ol className="divide-y divide-gold-border/15">
          {DUTIES.map((item) => (
            <li
              key={item.num}
              className="py-4 first:pt-1 last:pb-1 flex items-start gap-4 sm:gap-5"
            >
              <span className="w-9 h-8 rounded-sm bg-brand text-brand-contrast border border-gold-border/60 font-serif text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <p className="text-sm sm:text-[15px] text-text leading-relaxed pt-1">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Section 2: แนวทางที่องค์การนักเรียนพึงดำเนิน */}
      <section className="bg-surface border border-gold-border/40 p-6 sm:p-8 md:p-10 rounded-sm shadow-editorial relative space-y-6">
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        <div className="border-b border-gold-border/30 pb-4 flex items-baseline gap-3">
          <span className="font-serif text-sm sm:text-base font-bold text-gold-text shrink-0">
            02
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-accent">
            แนวทางที่องค์การนักเรียนพึงดำเนิน
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {GUIDELINES.map((item) => (
            <li
              key={item.num}
              className="p-4 sm:p-5 bg-surface-elevated border border-gold-border/30 rounded-sm flex items-start gap-3.5"
            >
              <span className="w-9 h-8 rounded-sm bg-brand text-brand-contrast border border-gold-border/60 font-serif text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <p className="text-sm sm:text-[15px] text-text leading-relaxed pt-0.5">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
