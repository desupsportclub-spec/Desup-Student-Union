import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { localizePath } from '../../lib/i18nRouting';

interface SeoHeadProps {
  /** คีย์ข้อความใน translation สำหรับ title (เช่น "seo.pages.news.title") */
  titleKey?: string;
  /** คีย์ข้อความใน translation สำหรับ description */
  descriptionKey?: string;
  /** ข้อความ title โดยตรง (กรณีหัวข้อข่าวหรือเนื้อหาจากฐานข้อมูล) */
  title?: string;
  /** ข้อความ description โดยตรง */
  description?: string;
  /** ใส่ชื่อเว็บไซต์ต่อท้ายหรือไม่ (ค่าเริ่มต้น true ยกเว้นหน้าหลัก) */
  appendSiteName?: boolean;
}

/**
 * จัดการแท็ก SEO <title>, <meta description>, Open Graph, <html lang> และ hreflang
 */
export const SeoHead: React.FC<SeoHeadProps> = ({
  titleKey,
  descriptionKey,
  title,
  description,
  appendSiteName = true,
}) => {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const location = useLocation();

  const siteTitle = t('seo.siteTitle');
  const rawTitle = title || (titleKey ? t(titleKey) : siteTitle);
  const fullTitle =
    appendSiteName && rawTitle !== siteTitle ? `${rawTitle} | ${siteTitle}` : rawTitle;
  const metaDesc =
    description || (descriptionKey ? t(descriptionKey) : t('seo.defaultDesc'));

  const origin =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const pathWithQuery = `${location.pathname}${location.search}`;
  const thUrl = `${origin}${localizePath(pathWithQuery, 'th')}`;
  const enUrl = `${origin}${localizePath(pathWithQuery, 'en')}`;
  const canonicalUrl = lang === 'en' ? enUrl : thUrl;

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : 'th_TH'} />
      <meta property="og:locale:alternate" content={lang === 'en' ? 'th_TH' : 'en_US'} />
      {origin && <link rel="canonical" href={canonicalUrl} />}
      {origin && <link rel="alternate" hrefLang="th" href={thUrl} />}
      {origin && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {origin && <link rel="alternate" hrefLang="x-default" href={thUrl} />}
    </Helmet>
  );
};
