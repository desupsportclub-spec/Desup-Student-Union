import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SupportedLang } from '../i18n';
import { getLangFromPath, LANG_STORAGE_KEY, localizePath, stripLangPrefix } from '../lib/i18nRouting';

interface LanguageContextValue {
  lang: SupportedLang;
  isEn: boolean;
  /** เส้นทางฐานที่ไม่มี /en นำหน้า เช่น /news หรือ / */
  basePathname: string;
  /** เปลี่ยนภาษาและนำทางไปยัง URL ของภาษานั้นโดยคงเส้นทางเดิมและพารามิเตอร์ไว้ */
  switchLanguage: (nextLang: SupportedLang) => void;
  /** แปลงเส้นทางภายในให้ตรงกับภาษาปัจจุบัน */
  localize: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'th',
  isEn: false,
  basePathname: '/',
  switchLanguage: () => {},
  localize: (path) => path,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const lang = getLangFromPath(location.pathname);
  const basePathname = stripLangPrefix(location.pathname);

  // ซิงค์ภาษาใน i18next, attribute <html lang> และ localStorage ทุกครั้งที่เปลี่ยนเส้นทาง
  useEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ข้ามหากเบราว์เซอร์บล็อก localStorage
    }
  }, [lang, i18n]);

  const switchLanguage = useCallback(
    (nextLang: SupportedLang) => {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, nextLang);
      } catch {
        // ข้ามหากเบราว์เซอร์บล็อก localStorage
      }
      if (nextLang === lang) return;
      const targetUrl = localizePath(
        `${location.pathname}${location.search}${location.hash}`,
        nextLang
      );
      navigate(targetUrl);
    },
    [lang, location.pathname, location.search, location.hash, navigate]
  );

  const localize = useCallback((path: string) => localizePath(path, lang), [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isEn: lang === 'en',
        basePathname,
        switchLanguage,
        localize,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
