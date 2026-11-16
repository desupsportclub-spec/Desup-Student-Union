import { SupportedLang } from '../i18n';

// คีย์สำหรับจดจำภาษาที่ผู้ใช้เลือกใน localStorage
export const LANG_STORAGE_KEY = 'lang';

/**
 * อ่านภาษาปัจจุบันจาก pathname (ถ้าขึ้นต้นด้วย /en หรือ /en/ จะเป็น 'en' มิฉะนั้นเป็น 'th')
 */
export function getLangFromPath(pathname: string): SupportedLang {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return 'en';
  }
  return 'th';
}

/**
 * ตัดคำนำหน้า /en ออกจาก pathname เพื่อได้เส้นทางฐานกลาง
 */
export function stripLangPrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/en/') {
    return '/';
  }
  if (pathname.startsWith('/en/')) {
    return pathname.slice(3) || '/';
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

/**
 * แปลงเส้นทางภายในให้ตรงกับภาษาเป้าหมาย (ปล่อย URL ภายนอกหรือ /admin ไว้ตามเดิม)
 */
export function localizePath(path: string, lang: SupportedLang): string {
  if (
    !path ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:') ||
    path.startsWith('#')
  ) {
    return path;
  }

  // แยก path, query string และ hash ออกจากกัน
  const match = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const rawPathname = match?.[1] || '/';
  const search = match?.[2] || '';
  const hash = match?.[3] || '';

  // เส้นทาง /admin ใช้ระบบหลังบ้านแยกต่างหาก ไม่เติม /en
  if (rawPathname === '/admin' || rawPathname.startsWith('/admin/')) {
    return `${rawPathname}${search}${hash}`;
  }

  const basePath = stripLangPrefix(rawPathname);
  if (lang === 'en') {
    const prefixed = basePath === '/' ? '/en' : `/en${basePath}`;
    return `${prefixed}${search}${hash}`;
  }

  return `${basePath}${search}${hash}`;
}
