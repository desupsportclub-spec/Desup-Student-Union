import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLang } from '../../i18n';

interface LanguageSwitcherProps {
  /** ปรับโทนสีเมื่อวางบนพื้นหลังสีม่วงเข้มตลอดเวลา (เช่น ลิ้นชักเมนูมือถือ) */
  onDarkSurface?: boolean;
  /** รูปแบบกะทัดรัดสำหรับแถบนำทางด้านบน */
  compact?: boolean;
  className?: string;
}

const LANGS: { code: SupportedLang; short: string; titleKey: string }[] = [
  { code: 'th', short: 'TH', titleKey: 'language.switchToTh' },
  { code: 'en', short: 'EN', titleKey: 'language.switchToEn' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onDarkSurface = false,
  compact = false,
  className = '',
}) => {
  const { lang, switchLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('language.ariaLabel')}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-sm border ${
        onDarkSurface
          ? 'bg-anchor-bg-deep/70 border-gold/25'
          : 'bg-surface/60 border-gold-border/30'
      } ${className}`}
    >
      {!compact && (
        <Globe
          weight="light"
          className={`w-3.5 h-3.5 mx-1 shrink-0 ${
            onDarkSurface ? 'text-anchor-gold/80' : 'text-gold-text'
          }`}
          aria-hidden="true"
        />
      )}
      {LANGS.map((item) => {
        const active = lang === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => switchLanguage(item.code)}
            aria-current={active ? 'true' : undefined}
            aria-label={t(item.titleKey)}
            title={t(item.titleKey)}
            className={`px-2 py-1 text-[11px] font-medium tracking-wider rounded-sm transition-colors cursor-pointer ${
              active
                ? 'bg-brand text-brand-contrast shadow-editorial-sm'
                : onDarkSurface
                ? 'text-anchor-text/75 hover:text-anchor-text hover:bg-anchor-text/5'
                : 'text-text-muted hover:text-heading hover:bg-bg-alt/60'
            }`}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
};
