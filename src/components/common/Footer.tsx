/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Emblem } from './Emblem';
import { RELATED_SYSTEM_LINKS, SITE_CONFIG } from '../../config/site';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const Footer: React.FC = () => {
  const { contactInfo, links, academicYearTH } = useSiteSettings();

  const relatedLinks = links && links.length > 0 ? links : RELATED_SYSTEM_LINKS;

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('desup:open-cookie-settings'));
  };

  return (
    <footer className="bg-anchor-bg text-anchor-text border-t border-gold/30 relative overflow-hidden">
      {/* Background Subtle Watermark */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.04] translate-x-12 translate-y-12">
        <Emblem size={380} />
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-10 md:pb-14 border-b border-gold/20">
          {/* Identity & School Info (4 columns) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <Emblem size={48} />
              <div>
                <h3 className="font-serif text-lg font-semibold tracking-wide text-anchor-text">
                  {SITE_CONFIG.name}
                </h3>
                <p className="text-xs text-anchor-gold tracking-wider">
                  {SITE_CONFIG.schoolName} · ปีการศึกษา {academicYearTH}
                </p>
              </div>
            </div>

            <p className="text-xs text-anchor-text/70 leading-relaxed max-w-sm">
              ขับเคลื่อนกิจกรรมส่งเสริมอัตลักษณ์อย่างสร้างสรรค์ พิทักษ์รักษาไว้ซึ่งสิทธิของนักเรียน
            </p>

            <div className="pt-2 text-xs text-anchor-text/80 space-y-1.5">
              <p><span className="text-anchor-gold">ที่อยู่:</span> {contactInfo.address}</p>
              <p><span className="text-anchor-gold">อีเมล:</span> {contactInfo.email}</p>
            </div>
          </div>

          {/* Quick Links Column 1: ข่าวสาร (2 columns) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
              ข่าวสาร
            </h4>
            <ul className="text-xs space-y-2 text-anchor-text/75">
              <li><Link to="/news/pr" className="hover:text-anchor-text transition-colors">ข่าวประชาสัมพันธ์</Link></li>
              <li><Link to="/news/activity" className="hover:text-anchor-text transition-colors">ภาพข่าวกิจกรรม</Link></li>
              <li><Link to="/calendar" className="hover:text-anchor-text transition-colors">ปฏิทินกิจกรรม</Link></li>
              <li><Link to="/news/video" className="hover:text-anchor-text transition-colors">คลิปวิดีโอ</Link></li>
            </ul>
          </div>

          {/* Quick Links Column 2: เกี่ยวกับเรา (2 columns) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
              เกี่ยวกับเรา
            </h4>
            <ul className="text-xs space-y-2 text-anchor-text/75">
              <li><Link to="/about/emblem" className="hover:text-anchor-text transition-colors">ตราสัญลักษณ์</Link></li>
              <li><Link to="/about/authority" className="hover:text-anchor-text transition-colors">อำนาจหน้าที่</Link></li>
              <li><Link to="/about/board" className="hover:text-anchor-text transition-colors">คณะกรรมการ</Link></li>
              <li><Link to="/about/advisors" className="hover:text-anchor-text transition-colors">คณะกรรมการที่ปรึกษา</Link></li>
              <li><Link to="/about/hall" className="hover:text-anchor-text transition-colors">ทำเนียบนายกองค์การนักเรียน</Link></li>
            </ul>
          </div>

          {/* Quick Links Column 3: ระบบที่เกี่ยวข้อง และบริการนักเรียน (4 columns) */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
                ระบบที่เกี่ยวข้อง
              </h4>
              <ul className="text-xs space-y-2.5 text-anchor-text/75">
                {relatedLinks.map((lnk, idx) => (
                  <li key={idx}>
                    {lnk.external !== false ? (
                      <a
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-anchor-text transition-colors inline-flex items-start gap-1"
                      >
                        <span>{lnk.title}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <Link to={lnk.url} className="hover:text-anchor-text transition-colors">
                        {lnk.title}
                      </Link>
                    )}
                  </li>
                ))}
                <li>
                  <a
                    href="https://satit.up.ac.th"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-anchor-text transition-colors"
                  >
                    เว็บไซต์โรงเรียนสาธิต มพ. ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.up.ac.th"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-anchor-text transition-colors"
                  >
                    มหาวิทยาลัยพะเยา ↗
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
                ระบบบริการนักเรียน
              </h4>
              <ul className="text-xs space-y-2 text-anchor-text/75">
                <li><Link to="/complaint" className="hover:text-anchor-text transition-colors">ส่งเรื่องร้องเรียน / ข้อเสนอแนะ</Link></li>
                <li><Link to="/track" className="hover:text-anchor-text transition-colors">ติดตามสถานะเรื่องร้องเรียน</Link></li>
                <li><Link to="/downloads" className="hover:text-anchor-text transition-colors">ดาวน์โหลดเอกสาร</Link></li>
                <li><Link to="/contact" className="hover:text-anchor-text transition-colors">ติดต่อเรา</Link></li>
              </ul>

              <div className="pt-2 space-y-1.5">
                <div>
                  <button
                    type="button"
                    onClick={handleOpenCookieSettings}
                    className="text-[11px] text-anchor-text/65 hover:text-anchor-gold underline transition-colors"
                  >
                    ตั้งค่าคุกกี้ (Cookie Settings)
                  </button>
                </div>
                <div>
                  <Link
                    to="/admin"
                    className="inline-block text-[11px] text-anchor-gold/60 hover:text-anchor-gold transition-colors"
                  >
                    เข้าสู่ระบบผู้ดูแล (Admin Portal)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & attribution (Evergreen) */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left text-xs text-anchor-text/60 gap-3 md:gap-4">
          <p>© พ.ศ. {new Date().getFullYear() + 543} {SITE_CONFIG.name} {SITE_CONFIG.schoolName}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-anchor-gold">โรงเรียนสาธิตมหาวิทยาลัยพะเยา</span>
            <span className="text-anchor-text/30 hidden sm:inline">|</span>
            <span>Demonstration School of University of Phayao Student Union</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
