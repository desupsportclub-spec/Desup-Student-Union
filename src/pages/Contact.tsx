/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SITE_CONFIG } from '../config/site';

export const Contact: React.FC = () => {
  const { contactInfo } = useSiteSettings();

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="Contact" thText="ติดต่อเรา" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          ติดต่อเรา
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left 5 Cols: Contact Information */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6 flex flex-col justify-between">
          <div className="bg-[#FAF7F0] border border-[#B8923A]/30 p-5 sm:p-6 rounded-sm shadow-editorial space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
              ข้อมูลการติดต่อ
            </h2>

            <div className="space-y-3.5 text-xs md:text-sm text-[#1B1226]/80 leading-relaxed">
              <div>
                <span className="font-semibold text-[#4B1F7A] block">สถานที่ตั้ง:</span>
                <span>{contactInfo.address}</span>
              </div>

              <div>
                <span className="font-semibold text-[#4B1F7A] block">อีเมล:</span>
                <span>{contactInfo.email}</span>
              </div>

              <div>
                <span className="font-semibold text-[#4B1F7A] block">Facebook Page:</span>
                <a
                  href={contactInfo.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#9C7A2B] hover:underline"
                >
                  {contactInfo.facebook} ↗
                </a>
              </div>
            </div>
          </div>

          {/* School Coordinates Note */}
          <div className="p-4 bg-[#EDE6F5]/50 border-l-2 border-[#B8923A] rounded-r-sm text-xs text-[#2A1245]">
            <p className="font-medium font-serif">เวลาทำการสำนักงานองค์การนักเรียน:</p>
            <p className="text-[#1B1226]/70 mt-1">วันจันทร์ - วันศุกร์ เวลา 07:30 - 17:00 น. (เว้นวันหยุดราชการ)</p>
          </div>
        </div>

        {/* Right 7 Cols: Embedded Google Maps */}
        <div className="lg:col-span-7 flex">
          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 sm:p-6 rounded-sm shadow-editorial relative w-full flex flex-col space-y-4">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
              แผนที่โรงเรียนสาธิตมหาวิทยาลัยพะเยา
            </h2>

            <div className="w-full flex-1 min-h-[280px] sm:min-h-[340px] rounded-sm overflow-hidden border border-[#B8923A]/30">
              <iframe
                src={SITE_CONFIG.contact.mapIframeUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
                className="w-full h-full min-h-[280px] sm:min-h-[340px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
