import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Monitor, Moon, Sun } from '@phosphor-icons/react';
import { ThemeMode, useTheme } from '../../context/ThemeContext';

interface ThemeOption {
  value: ThemeMode;
  labelKey: string;
  Icon: typeof Sun;
}

// ตัวเลือกโหมดสี (คำแปลอยู่ใน src/i18n/locales/*.json ใต้คีย์ theme.*)
const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', labelKey: 'theme.light', Icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', Icon: Moon },
  { value: 'system', labelKey: 'theme.system', Icon: Monitor },
];

interface ThemeSwitcherProps {
  /** รูปแบบการแสดงผล: 'dropdown' สำหรับแถบนำทางด้านบน / 'compact' สำหรับลิ้นชักมือถือและ Sidebar แอดมิน */
  variant?: 'dropdown' | 'compact';
  /** เปิดเมนูขึ้นด้านบน (เหมาะสำหรับวางไว้ด้านล่างของ Sidebar แอดมิน) */
  dropUp?: boolean;
  /** ปรับโทนสำหรับพื้นหลังเข้มตลอดเวลา (เช่น ลิ้นชักเมนูมือถือ) */
  onDarkSurface?: boolean;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'dropdown',
  dropUp = false,
  onDarkSurface = false,
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const activeOption = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];
  const activeLabel = t(activeOption.labelKey);

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label={t('theme.groupAria')}
        className={`inline-flex items-center gap-1 p-1 rounded-sm border ${
          onDarkSurface
            ? 'bg-anchor-bg-deep/70 border-gold/25'
            : 'bg-bg-alt/70 border-gold-border/25'
        } ${className}`}
      >
        {THEME_OPTIONS.map(({ value, labelKey, Icon }) => {
          const active = theme === value;
          const label = t(labelKey);
          return (
            <button
              key={value}
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTheme(value, {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              aria-pressed={active}
              title={t('theme.modePrefix', { label })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
                active
                  ? onDarkSurface
                    ? 'bg-brand text-brand-contrast font-medium'
                    : 'bg-brand text-brand-contrast font-medium shadow-editorial-sm'
                  : onDarkSurface
                  ? 'text-anchor-text/70 hover:text-anchor-text hover:bg-anchor-text/5'
                  : 'text-text-muted hover:text-heading hover:bg-surface/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" weight="light" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('theme.triggerAria', { label: activeLabel })}
        title={t('theme.triggerTitle')}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-sm border transition-colors cursor-pointer ${
          onDarkSurface
            ? 'border-gold/25 text-anchor-text hover:bg-anchor-text/10'
            : 'border-gold-border/30 bg-surface/60 text-heading hover:border-gold-text hover:bg-surface'
        }`}
      >
        <span className="relative w-4 h-4 flex items-center justify-center">
          <Sun
            weight="light"
            className={`w-4 h-4 absolute transition-all duration-300 ${
              resolvedTheme === 'light'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 -rotate-90 scale-75'
            }`}
          />
          <Moon
            weight="light"
            className={`w-4 h-4 absolute transition-all duration-300 ${
              resolvedTheme === 'dark'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 rotate-90 scale-75'
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('theme.menuAria')}
          className={`absolute right-0 w-40 bg-surface border border-gold-border/25 shadow-editorial rounded-sm py-1.5 z-50 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="px-3 py-1 border-b border-gold-border/15 mb-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-gold-text font-medium">
              {t('theme.heading')}
            </span>
          </div>
          {THEME_OPTIONS.map(({ value, labelKey, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTheme(value, {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-brand-soft/60 text-heading font-medium'
                    : 'text-text-muted hover:bg-bg-alt/60 hover:text-heading'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gold-text" weight="light" />
                  <span>{t(labelKey)}</span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-accent" weight="light" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
