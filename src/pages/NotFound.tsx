/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Emblem } from '../components/common/Emblem';
import { LocLink } from '../components/common/LocLink';
import { SeoHead } from '../components/common/SeoHead';

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <SeoHead titleKey="notFound.title" descriptionKey="notFound.desc" />

      <div className="relative mb-6">
        <span
          className="font-serif text-8xl md:text-9xl font-bold tracking-widest select-none"
          style={{
            WebkitTextStroke: '2px var(--color-gold)',
            color: 'transparent'
          }}
        >
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Emblem size={64} />
        </div>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-semibold text-heading mb-3">
        {t('notFound.title')}
      </h1>

      <p className="text-xs md:text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
        {t('notFound.desc')}
      </p>

      <LocLink
        to="/"
        className="px-8 py-3 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors shadow-editorial inline-flex items-center gap-2"
      >
        <span>{t('notFound.backHome')}</span>
      </LocLink>
    </div>
  );
};
