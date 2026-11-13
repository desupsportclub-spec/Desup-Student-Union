/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SectionEyebrow } from '../../components/common/Ornament';

interface SubItem {
  num: string;
  text: string;
}

interface ClauseBlock {
  clause: string;
  heading: string;
  lead?: string;
  items?: SubItem[];
  columns?: 1 | 2;
}

interface ArticleChapter {
  number: string;
  range: string;
  title: string;
  blocks: ClauseBlock[];
}

const CHAPTERS: ArticleChapter[] = [
  {
    number: "หมวดที่ ๑",
    range: "ข้อ ๑ – ๔",
    title: "บททั่วไปและคำนิยาม",
    blocks: [
      {
        clause: "ข้อ ๑ – ๒",
        heading: "ชื่อประกาศและการมีผลบังคับใช้",
        lead: "ประกาศนี้เรียกว่า “ประกาศโรงเรียนสาธิตมหาวิทยาลัยพะเยา เรื่อง องค์การนักเรียน พ.ศ. ๒๕๖๙” อาศัยอำนาจตามมาตรา ๓๓ แห่งพระราชบัญญัติมหาวิทยาลัยพะเยา พ.ศ. ๒๕๕๓ และข้อ ๑๘ ตามระเบียบมหาวิทยาลัยพะเยา ว่าด้วย การบริหารโรงเรียนสาธิตมหาวิทยาลัยพะเยา พ.ศ. ๒๕๖๔ ประกอบกับคำสั่งมหาวิทยาลัยพะเยา ที่ ๒๐๐๒/๒๕๖๘ โดยให้ใช้บังคับตั้งแต่วันถัดจากวันประกาศเป็นต้นไป"
      },
      {
        clause: "ข้อ ๓",
        heading: "ลำดับการบังคับใช้",
        lead: "บรรดาประกาศ คำสั่ง หรือมติอื่นใดที่มีข้อกำหนดหรือสั่งการอันเกี่ยวข้องกับองค์การนักเรียน ที่ยังมีผลใช้บังคับอยู่ หากมีกำหนดไว้แล้วในประกาศฉบับนี้ หรือขัดหรือแย้งกับประกาศนี้ ให้ใช้ประกาศฉบับนี้"
      },
      {
        clause: "ข้อ ๔",
        heading: "คำนิยามสำคัญ",
        columns: 1,
        items: [
          {
            num: "งานกิจการนักเรียน",
            text: "งานกิจการนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา ทำหน้าที่กำกับดูแลและติดตามการดำเนินงานขององค์การนักเรียน"
          },
          {
            num: "องค์การนักเรียน",
            text: "องค์การนักเรียนโรงเรียนสาธิตมหาวิทยาลัยพะเยา ซึ่งเป็นคณะกรรมการนักเรียนภายใต้การกำกับดูแลของงานกิจการนักเรียน"
          },
          {
            num: "คณะกรรมการที่ปรึกษา",
            text: "บุคลากรโรงเรียน หรือนักเรียนผู้มีประสบการณ์ ซึ่งโรงเรียนได้แต่งตั้งเพื่อทำหน้าที่ให้คำปรึกษา แนะนำ ดูแล และช่วยเหลือในการดำเนินกิจกรรมขององค์การนักเรียน"
          }
        ]
      }
    ]
  },
  {
    number: "หมวดที่ ๒",
    range: "ข้อ ๗ – ๘",
    title: "อำนาจหน้าที่และแนวทางพึงดำเนิน",
    blocks: [
      {
        clause: "ข้อ ๗",
        heading: "อำนาจหน้าที่ขององค์การนักเรียน",
        columns: 1,
        items: [
          {
            num: "(๑)",
            text: "รักษาผลประโยชน์และสิทธิอันชอบธรรมของนักเรียนในเรื่องเกี่ยวกับกิจการนักเรียน"
          },
          {
            num: "(๒)",
            text: "บริหารกิจกรรมที่เกี่ยวกับองค์การนักเรียน ให้เป็นไปตามนโยบายที่ได้แถลงไว้ ซึ่งไม่ขัดข้อบังคับ ระเบียบ ประกาศ นโยบายของโรงเรียน"
          },
          {
            num: "(๓)",
            text: "ปฏิบัติงานอื่น ๆ ตามที่โรงเรียนมอบหมาย"
          }
        ]
      },
      {
        clause: "ข้อ ๘",
        heading: "แนวทางที่องค์การนักเรียนพึงดำเนิน",
        columns: 2,
        items: [
          { num: "(๑)", text: "รักษาไว้ซึ่งผลประโยชน์ส่วนรวมของนักเรียน" },
          { num: "(๒)", text: "รักษาไว้ซึ่งประสิทธิภาพในการขับเคลื่อนการดำเนินกิจกรรมนักเรียน" },
          { num: "(๓)", text: "ยึดมั่นและศรัทธาในการปกครองของระบบประชาธิปไตย" },
          { num: "(๔)", text: "ยึดมั่นในข้อบังคับ ระเบียบ ประกาศ คำสั่ง และนโยบายของโรงเรียนอย่างเคร่งครัด" },
          { num: "(๕)", text: "เป็นผู้ส่งเสริมกิจกรรมเสริมหลักสูตร ตามอัตลักษณ์นักเรียนของโรงเรียน รักษาไว้ซึ่งศิลปะและวัฒนธรรมของชาติ ทำนุบำรุง อนุรักษ์ ฟื้นฟู สืบสานสร้างสรรค์" },
          { num: "(๖)", text: "เป็นผู้มีความซื่อสัตย์ สุจริต บริหารงานอย่างโปร่งใส ใฝ่เรียนรู้และกระตือรือร้น" },
          { num: "(๗)", text: "มีความเป็นผู้นำและผู้ตามที่ดี" },
          { num: "(๘)", text: "เผยแพร่ชื่อเสียงและเกียรติคุณของโรงเรียน" }
        ]
      }
    ]
  },
  {
    number: "หมวดที่ ๓",
    range: "ข้อ ๕ – ๖, ๙ – ๑๐, ๑๓",
    title: "องค์ประกอบ คุณสมบัติ และวาระการดำรงตำแหน่ง",
    blocks: [
      {
        clause: "ข้อ ๕",
        heading: "องค์ประกอบคณะกรรมการองค์การนักเรียน",
        lead: "ให้มีคณะกรรมการองค์การนักเรียน ประกอบด้วยตำแหน่งและฝ่ายงานต่าง ๆ ดังนี้ (รวม (๑)–(๑๐) ไม่เกิน ๒๐ คน)",
        columns: 2,
        items: [
          { num: "(๑)", text: "นายกองค์การนักเรียน" },
          { num: "(๒)", text: "อุปนายกองค์การนักเรียน" },
          { num: "(๓)", text: "ฝ่ายเลขานุการ" },
          { num: "(๔)", text: "ฝ่ายเหรัญญิก" },
          { num: "(๕)", text: "ฝ่ายกิจกรรมนักเรียน" },
          { num: "(๖)", text: "ฝ่ายประชาสัมพันธ์" },
          { num: "(๗)", text: "ฝ่ายวิชาการ" },
          { num: "(๘)", text: "ฝ่ายวินัยนักเรียน" },
          { num: "(๙)", text: "ฝ่ายศิลปวัฒนธรรม" },
          { num: "(๑๐)", text: "ฝ่ายกีฬาและนันทนาการ" },
          { num: "(๑๑)", text: "กรรมการอื่น ๆ ตามความเหมาะสม" }
        ]
      },
      {
        clause: "ข้อ ๖",
        heading: "คุณสมบัติขององค์การนักเรียน",
        columns: 1,
        items: [
          { num: "(๑)", text: "สร้างสรรค์และจัดกิจกรรมตามอัตลักษณ์นักเรียนของโรงเรียนให้แก่นักเรียน" },
          { num: "(๒)", text: "เป็นนักเรียนที่กำลังศึกษาอยู่ในระดับมัธยมศึกษาปีที่ ๕" },
          { num: "(๓)", text: "มีระดับเกรดเฉลี่ยหรือคะแนนผลการเรียนจนถึงวันสมัครไม่น้อยกว่า ๓.๐๐" },
          { num: "(๔)", text: "ไม่อยู่ในระหว่างถูกลงโทษทางวินัยตามข้อบังคับของโรงเรียน" },
          { num: "(๕)", text: "ปฏิบัติตามกฎ ระเบียบ ของโรงเรียนอย่างเคร่งครัด" }
        ]
      },
      {
        clause: "ข้อ ๙ – ๑๐",
        heading: "การได้มาและวาระการดำรงตำแหน่ง",
        lead: "คุณสมบัติ หลักเกณฑ์ และวิธีการได้มาซึ่งองค์การนักเรียนและสมาชิกภาพของคณะกรรมการให้เป็นไปตามประกาศของโรงเรียน โดยคณะกรรมการองค์การนักเรียนมีวาระดำรงตำแหน่ง ๑ ปีการศึกษา นับแต่วันที่ได้รับการแต่งตั้งเป็นทางการจากโรงเรียน"
      },
      {
        clause: "ข้อ ๑๓",
        heading: "การสิ้นสุดสมาชิกภาพขององค์การนักเรียน",
        columns: 2,
        items: [
          { num: "(๑)", text: "ตาย" },
          { num: "(๒)", text: "ลาออก" },
          { num: "(๓)", text: "กระทำผิดวินัยของโรงเรียนอย่างร้ายแรง" },
          { num: "(๔)", text: "พ้นสภาพการเป็นนักเรียน" },
          { num: "(๕)", text: "ลาพักการศึกษา" },
          { num: "(๖)", text: "ถูกถอดถอนตามมติที่ประชุมองค์การนักเรียน" }
        ]
      }
    ]
  },
  {
    number: "หมวดที่ ๔",
    range: "ข้อ ๑๔ – ๑๖",
    title: "คณะกรรมการที่ปรึกษา การดำเนินกิจกรรม และผู้รักษาการ",
    blocks: [
      {
        clause: "ข้อ ๑๔",
        heading: "หน้าที่ของคณะกรรมการที่ปรึกษาองค์การนักเรียน",
        lead: "ให้มีคณะกรรมการที่ปรึกษาองค์การนักเรียน ทำหน้าที่ให้คำปรึกษา ข้อแนะนำ ในกิจการต่าง ๆ เพื่อให้เป็นไปตามเจตนารมณ์และวัตถุประสงค์ที่ได้ตั้งไว้"
      },
      {
        clause: "ข้อ ๑๕",
        heading: "การขออนุมัติและกำกับดูแลการดำเนินกิจกรรม",
        lead: "การดำเนินกิจกรรมขององค์การนักเรียน ต้องขออนุมัติในนามขององค์การนักเรียน โดยจะต้องอยู่ในความดูแลของคณะกรรมการที่ปรึกษา ทั้งนี้ให้งานกิจการนักเรียน มีหน้าที่กำกับดูแล ติดตามการดำเนินงาน"
      },
      {
        clause: "ข้อ ๑๖",
        heading: "ผู้รักษาการและการวินิจฉัยชี้ขาด",
        lead: "ให้ผู้อำนวยการหรือรองผู้อำนวยการที่ผู้อำนวยการมอบหมาย เป็นผู้รักษาการตามประกาศนี้ ในกรณีที่มีปัญหาเกี่ยวกับการบังคับใช้หรือการปฏิบัติตามประกาศนี้ ให้ผู้อำนวยการหรือรองผู้อำนวยการที่ผู้อำนวยการมอบหมาย มีอำนาจตีความและวินิจฉัยชี้ขาด การตีความและวินิจฉัยให้ถือเป็นที่สุด"
      }
    ]
  }
];

export const AboutAuthority: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-6 sm:pb-8 text-center max-w-2xl mx-auto space-y-2.5">
        <SectionEyebrow enText="CHARTER & POWERS" thText="อำนาจหน้าที่และธรรมนูญ" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          อำนาจหน้าที่และประกาศองค์การนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          ตามประกาศโรงเรียนสาธิตมหาวิทยาลัยพะเยา เรื่อง องค์การนักเรียน พ.ศ. ๒๕๖๙
        </p>
      </div>

      {/* Accordion Chapters */}
      <div className="divide-y divide-[#B8923A]/30 border-y border-[#B8923A]/30">
        {CHAPTERS.map((chapter, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={chapter.number} className="py-4 sm:py-5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-3 sm:gap-4 text-left py-1.5 group focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5 min-w-0">
                  <span className="font-serif text-xs sm:text-sm text-[#9C7A2B] font-semibold shrink-0 sm:w-24">
                    {chapter.number}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-serif text-base sm:text-lg md:text-xl font-semibold text-[#1B1226] group-hover:text-[#4B1F7A] transition-colors">
                      {chapter.title}
                    </h2>
                    <span className="text-xs text-[#1B1226]/50 font-sans">
                      {chapter.range}
                    </span>
                  </div>
                </div>
                <span className="text-[#9C7A2B] font-serif text-xl shrink-0 w-6 text-center">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="mt-5 pt-5 border-t border-[#4B1F7A]/10 sm:pl-29 space-y-6 animate-fadeIn">
                  {chapter.blocks.map((block, bIdx) => (
                    <div
                      key={bIdx}
                      className={bIdx > 0 ? 'pt-5 border-t border-[#4B1F7A]/10' : ''}
                    >
                      {/* Clause Title */}
                      <div className="flex items-baseline gap-2.5 mb-2.5">
                        <span className="font-serif text-sm font-bold text-[#4B1F7A] shrink-0">
                          {block.clause}
                        </span>
                        <h3 className="font-serif text-base font-semibold text-[#1B1226]">
                          {block.heading}
                        </h3>
                      </div>

                      {/* Lead paragraph if present */}
                      {block.lead && (
                        <p className="text-sm text-[#1B1226]/80 leading-relaxed max-w-3xl">
                          {block.lead}
                        </p>
                      )}

                      {/* Structured sub-items list */}
                      {block.items && block.items.length > 0 && (
                        <dl
                          className={`mt-3 ${
                            block.columns === 2
                              ? 'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5'
                              : 'space-y-2.5 max-w-3xl'
                          }`}
                        >
                          {block.items.map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="flex items-baseline gap-3 text-sm text-[#1B1226]/85 leading-relaxed"
                            >
                              <dt className="font-serif font-semibold text-[#9C7A2B] shrink-0">
                                {item.num}
                              </dt>
                              <dd className="text-[#1B1226]/80">
                                {item.text}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
