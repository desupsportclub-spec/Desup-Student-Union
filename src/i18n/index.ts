import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import th from './locales/th.json';
import en from './locales/en.json';

export type SupportedLang = 'th' | 'en';

export const SUPPORTED_LANGS: SupportedLang[] = ['th', 'en'];
export const DEFAULT_LANG: SupportedLang = 'th';

// ตรวจสอบภาษาเริ่มต้นจาก URL ปัจจุบันก่อนโหลด React เพื่อความสอดคล้องของเส้นทาง
function detectInitialLang(): SupportedLang {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname === '/en' || pathname.startsWith('/en/')) {
      return 'en';
    }
  }
  return DEFAULT_LANG;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      th: { translation: th },
      en: { translation: en },
    },
    lng: detectInitialLang(),
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
