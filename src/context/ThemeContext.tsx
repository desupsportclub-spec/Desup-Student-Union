import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

// ประเภทของโหมดสีที่ผู้ใช้เลือกได้: สว่าง / มืด / ตามระบบ
export type ThemeMode = 'light' | 'dark' | 'system';
// ประเภทของโหมดสีที่แสดงผลจริงหลังคำนวณค่า 'system' แล้ว
export type ResolvedTheme = 'light' | 'dark';

// สี theme-color สำหรับแถบสถานะเบราว์เซอร์
const THEME_COLOR_LIGHT = '#F5EEDC';
const THEME_COLOR_DARK = '#12081D';
const STORAGE_KEY = 'theme';

interface ThemeContextValue {
  /** ค่าที่ผู้ใช้เลือก ('light' | 'dark' | 'system') */
  theme: ThemeMode;
  /** ค่าที่ใช้งานจริง ณ ปัจจุบัน ('light' | 'dark') */
  resolvedTheme: ResolvedTheme;
  /** เปลี่ยนโหมดสี พร้อมตำแหน่งจุดกำเนิดแอนิเมชัน View Transitions (ถ้ามี) */
  setTheme: (next: ThemeMode, origin?: { x: number; y: number } | HTMLElement | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isValidThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isValidThemeMode(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // ติดตามการเปลี่ยนแปลงโหมดมืด/สว่างของระบบปฏิบัติการเมื่อเลือก 'system'
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(mq.matches ? 'dark' : 'light');
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // อัปเดต DOM และ localStorage เมื่อค่าโหมดเปลี่ยน
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ข้ามหากเบราว์เซอร์ปิดกั้น localStorage
    }
  }, [theme, resolvedTheme]);

  // ซิงค์ข้ามแท็บเมื่อผู้ใช้เปลี่ยนโหมดในแท็บอื่น
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setThemeState(isValidThemeMode(e.newValue) ? e.newValue : 'system');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode, origin?: { x: number; y: number } | HTMLElement | null) => {
      const nextResolved: ResolvedTheme = next === 'system' ? getSystemTheme() : next;
      const root = document.documentElement;

      // หากโหมดจริงไม่เปลี่ยน (เช่น กดตัวเลือกเดิม หรือ system ตรงกับค่าปัจจุบัน) ให้อัปเดต state ปกติ
      const willVisualChange = nextResolved !== resolvedTheme;
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      if (willVisualChange && docWithVT.startViewTransition && !prefersReducedMotion) {
        // คำนวณจุดศูนย์กลางและรัศมีวงกลมสำหรับการเปลี่ยนธีมแบบ View Transitions
        let x = window.innerWidth / 2;
        let y = 36;
        if (origin && 'x' in origin && 'y' in origin) {
          x = origin.x;
          y = origin.y;
        } else if (origin instanceof HTMLElement) {
          const rect = origin.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
        const maxRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
        root.style.setProperty('--vt-x', `${x}px`);
        root.style.setProperty('--vt-y', `${y}px`);
        root.style.setProperty('--vt-r', `${Math.ceil(maxRadius)}px`);

        docWithVT.startViewTransition(() => {
          flushSync(() => {
            setThemeState(next);
          });
          applyThemeToDOM(nextResolved);
        });
        return;
      }

      // กรณีเบราว์เซอร์ไม่รองรับ View Transitions ใช้การเปลี่ยนสีแบบนุ่มนวล 150ms
      if (willVisualChange && !prefersReducedMotion) {
        root.classList.add('theme-transitioning');
        window.setTimeout(() => root.classList.remove('theme-transitioning'), 200);
      }
      setThemeState(next);
      applyThemeToDOM(nextResolved);
    },
    [resolvedTheme]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme ต้องถูกเรียกใช้ภายใน ThemeProvider');
  }
  return ctx;
}
