/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Emblem } from './Emblem';
import { RELATED_SYSTEM_LINKS } from '../../config/site';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LocLink } from './LocLink';
import { formatAcademicYear } from '../../lib/format';

export const Footer: React.FC = () => {
  const { contactInfo, links, academicYearTH } = useSiteSettings();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const relatedLinks = links && links.length > 0 ? links : RELATED_SYSTEM_LINKS;
  const displayAcademicYear = formatAcademicYear(academicYearTH, lang);
  const currentYear = lang === 'en' ? new Date().getFullYear() : new Date().getFullYear() + 543;

  // แปลงชื่อลิงก์ระบบที่เกี่ยวข้องเริ่มต้นให้สอดคล้องกับภาษาที่เลือก
  const resolveRelatedLinkTitle = (title: string) => {
    if (lang !== 'en') return title;
    if (title === 'ระบบบริหารงานวิชาการ') return t('footer.academicSystem');
    if (title === 'ระบบบริหารงานกิจการนักเรียน') return t('footer.studentAffairsSystem');
    if (title === 'เพจ Facebook องค์การนักเรียน') return t('footer.facebookPage');
    return title;
  };

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('desup:open-cookie-settings'));
  };

  return (
    <footer className="bg-anchor-bg text-anchor-text border-t border-gold/30 relative overflow-hidden">
      {/* ลายน้ำตราสัญลักษณ์พื้นหลัง */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.04] translate-x-12 translate-y-12">
        <Emblem size={380} />
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-10 md:pb-14 border-b border-gold/20">
          {/* ข้อมูลองค์กร (4 คอลัมน์) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <Emblem size={48} />
              <div>
                <h3 className="font-serif text-lg font-semibold tracking-wide text-anchor-text">
                  {t('site.name')}
                </h3>
                <p className="text-xs text-anchor-gold tracking-wider">
                  {t('site.schoolName')} · {t('site.academicYearLabel', { year: displayAcademicYear })}
                </p>
              </div>
            </div>

            <p className="text-xs text-anchor-text/70 leading-relaxed max-w-sm">
              {t('site.vision')}
            </p>

            <div className="pt-2 text-xs text-anchor-text/80 space-y-1.5">
              <p><span className="text-anchor-gold">{t('footer.addressLabel')}</span> {contactInfo.address}</p>
              <p><span className="text-anchor-gold">{t('footer.emailLabel')}</span> {contactInfo.email}</p>
            </div>
          </div>

          {/* คอลัมน์ลิงก์ 1: ข่าวสาร (2 คอลัมน์) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
              {t('footer.newsCol')}
            </h4>
            <ul className="text-xs space-y-2 text-anchor-text/75">
              <li><LocLink to="/news/pr" className="hover:text-anchor-text transition-colors">{t('nav.newsSub.pr')}</LocLink></li>
              <li><LocLink to="/news/activity" className="hover:text-anchor-text transition-colors">{t('nav.newsSub.activity')}</LocLink></li>
              <li><LocLink to="/calendar" className="hover:text-anchor-text transition-colors">{t('nav.calendar')}</LocLink></li>
              <li><LocLink to="/news/video" className="hover:text-anchor-text transition-colors">{t('nav.newsSub.video')}</LocLink></li>
            </ul>
          </div>

          {/* คอลัมน์ลิงก์ 2: เกี่ยวกับเรา (2 คอลัมน์) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
              {t('footer.aboutCol')}
            </h4>
            <ul className="text-xs space-y-2 text-anchor-text/75">
              <li><LocLink to="/about/emblem" className="hover:text-anchor-text transition-colors">{t('nav.aboutSub.emblem')}</LocLink></li>
              <li><LocLink to="/about/authority" className="hover:text-anchor-text transition-colors">{t('nav.aboutSub.authority')}</LocLink></li>
              <li><LocLink to="/about/board" className="hover:text-anchor-text transition-colors">{t('footer.boardShort')}</LocLink></li>
              <li><LocLink to="/about/advisors" className="hover:text-anchor-text transition-colors">{t('nav.aboutSub.advisors')}</LocLink></li>
              <li><LocLink to="/about/hall" className="hover:text-anchor-text transition-colors">{t('nav.aboutSub.hall')}</LocLink></li>
            </ul>
          </div>

          {/* คอลัมน์ลิงก์ 3: ระบบที่เกี่ยวข้อง และบริการนักเรียน (4 คอลัมน์) */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
                {t('footer.relatedCol')}
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
                        <span>{resolveRelatedLinkTitle(lnk.title)}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <LocLink to={lnk.url} className="hover:text-anchor-text transition-colors">
                        {resolveRelatedLinkTitle(lnk.title)}
                      </LocLink>
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
                    {t('footer.schoolWebsite')} ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.up.ac.th"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-anchor-text transition-colors"
                  >
                    {t('footer.universityWebsite')} ↗
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-anchor-gold">
                {t('footer.servicesCol')}
              </h4>
              <ul className="text-xs space-y-2 text-anchor-text/75">
                <li><LocLink to="/complaint" className="hover:text-anchor-text transition-colors">{t('nav.reportFull')}</LocLink></li>
                <li><LocLink to="/track" className="hover:text-anchor-text transition-colors">{t('nav.trackComplaint')}</LocLink></li>
                <li><LocLink to="/downloads" className="hover:text-anchor-text transition-colors">{t('nav.downloadsFull')}</LocLink></li>
                <li><LocLink to="/contact" className="hover:text-anchor-text transition-colors">{t('nav.contactUs')}</LocLink></li>
              </ul>

              <div className="pt-2 space-y-1.5">
                <div>
                  <button
                    type="button"
                    onClick={handleOpenCookieSettings}
                    className="text-[11px] text-anchor-text/65 hover:text-anchor-gold underline transition-colors"
                  >
                    {t('footer.cookieSettings')}
                  </button>
                </div>
                <div>
                  <Link
                    to="/admin"
                    className="inline-block text-[11px] text-anchor-gold/60 hover:text-anchor-gold transition-colors"
                  >
                    {t('footer.adminPortal')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ลิขสิทธิ์และชื่อองค์กรด้านล่างสุด */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left text-xs text-anchor-text/60 gap-3 md:gap-4">
          <p>{t('site.copyright', { year: currentYear, name: t('site.name'), school: t('site.schoolName') })}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-anchor-gold">{t('site.schoolName')}</span>
            <span className="text-anchor-text/30 hidden sm:inline">|</span>
            <span>{t('site.englishFullName')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
