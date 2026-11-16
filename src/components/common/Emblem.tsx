/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../config/site';

interface EmblemProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const Emblem: React.FC<EmblemProps> = ({ className = "w-12 h-12", size = 48, animate = false }) => {
  const { t } = useTranslation();

  // หากกำหนดพาธไฟล์ภาพตราสัญลักษณ์ไว้ใน site.ts ให้แสดงภาพนั้นโดยตรง
  if (SITE_CONFIG.emblemUrl) {
    return (
      <img
        src={SITE_CONFIG.emblemUrl}
        alt={t('site.schoolName')}
        data-emblem="true"
        className={`object-contain ${className}`}
        width={size}
        height={size}
      />
    );
  }

  // ตราสัญลักษณ์สำรองในโทนม่วง-ทอง
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={t('seo.siteTitle')}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--gold-light))" />
          <stop offset="50%" stopColor="rgb(var(--gold))" />
          <stop offset="100%" stopColor="rgb(var(--gold-text))" />
        </linearGradient>
        <linearGradient id="violetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--brand))" />
          <stop offset="100%" stopColor="rgb(var(--anchor-bg))" />
        </linearGradient>
      </defs>

      {/* Outer Golden Shield Border */}
      <path
        d="M50 4 L88 18 C88 58 74 94 50 110 C26 94 12 58 12 18 Z"
        fill="url(#violetGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className={animate ? "animate-pulse" : ""}
      />

      {/* Inner Decorative Hairline */}
      <path
        d="M50 11 L82 23 C82 56 69 88 50 102 C31 88 18 56 18 23 Z"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="1"
        strokeOpacity="0.6"
      />

      {/* Top Diamond Finial */}
      <path
        d="M50 16 L54 21 L50 26 L46 21 Z"
        fill="url(#goldGrad)"
      />

      {/* Central Flame / Torch / Sun Motif */}
      <circle cx="50" cy="42" r="11" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <path
        d="M50 34 C50 34 52 38 52 42 C52 46 50 47 50 47 C50 47 48 46 48 42 C48 38 50 34 50 34 Z"
        fill="url(#goldGrad)"
      />

      {/* Thai Typography: สธ.มพ */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fill="rgb(var(--anchor-text))"
        fontFamily="'Cormorant Garamond', 'Noto Serif Thai', serif"
        fontWeight="600"
        fontSize="14"
        letterSpacing="1"
      >
        สธ.มพ
      </text>

      {/* Ribbon / Scroll base */}
      <path
        d="M32 78 C42 81 58 81 68 78 L65 84 C56 86 44 86 35 84 Z"
        fill="url(#goldGrad)"
      />

      {/* Subtle year indicator */}
      <text
        x="50"
        y="96"
        textAnchor="middle"
        fill="rgb(var(--anchor-gold))"
        fontFamily="'Cormorant Garamond', serif"
        fontWeight="500"
        fontSize="9"
        letterSpacing="1"
      >
        DESUP
      </text>
    </svg>
  );
};
