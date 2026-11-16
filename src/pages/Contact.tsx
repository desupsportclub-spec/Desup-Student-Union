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
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="Contact" thText="ติดต่อเรา" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading">
          ติดต่อเรา
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left 5 Cols: Contact Information */}
        <div className="lg:col-span-5">
          <div className="bg-surface border border-gold-border/30 p-5 sm:p-6 rounded-sm shadow-editorial space-y-4">
            <h2 className="font-serif text-xl font-semibold text-heading">
              ข้อมูลการติดต่อ
            </h2>

            <div className="space-y-3.5 text-xs md:text-sm text-text/85 leading-relaxed">
              <div>
                <span className="font-semibold text-accent block">สถานที่ตั้ง:</span>
                <span>{contactInfo.address}</span>
              </div>

              <div>
                <span className="font-semibold text-accent block">อีเมล:</span>
                <span>{contactInfo.email}</span>
              </div>

              <div>
                <span className="font-semibold text-accent block">Facebook Page:</span>
                <a
                  href={contactInfo.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold-text hover:underline"
                >
                  {contactInfo.facebook} ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Embedded Google Maps */}
        <div className="lg:col-span-7 flex">
          <div className="bg-surface border border-gold-border/20 p-5 sm:p-6 rounded-sm shadow-editorial relative w-full flex flex-col space-y-4">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <h2 className="font-serif text-xl font-semibold text-heading">
              แผนที่โรงเรียนสาธิตมหาวิทยาลัยพะเยา
            </h2>

            <div className="w-full flex-1 min-h-[280px] sm:min-h-[340px] rounded-sm overflow-hidden border border-gold-border/30">
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
