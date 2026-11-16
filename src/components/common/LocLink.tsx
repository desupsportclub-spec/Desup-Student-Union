import React from 'react';
import { Link, LinkProps, To } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { localizePath } from '../../lib/i18nRouting';

/**
 * คอมโพเนนต์ลิงก์ภายในเว็บที่เติมหรือตัด /en ให้อัตโนมัติตามภาษาปัจจุบัน
 */
export const LocLink: React.FC<LinkProps> = ({ to, ...rest }) => {
  const { lang } = useLanguage();

  let localizedTo: To = to;
  if (typeof to === 'string') {
    localizedTo = localizePath(to, lang);
  } else if (to && typeof to === 'object') {
    localizedTo = {
      ...to,
      pathname: to.pathname ? localizePath(to.pathname, lang) : undefined,
    };
  }

  return <Link to={localizedTo} {...rest} />;
};
