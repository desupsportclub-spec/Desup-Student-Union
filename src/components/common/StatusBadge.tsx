/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ComplaintStatus, NewsCategory, RegulationSubType } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const ComplaintStatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useTranslation();

  const config: Record<ComplaintStatus, { label: string; dotColor: string; textColor: string }> = {
    received: {
      label: t('status.complaint.received'),
      dotColor: 'bg-accent/70',
      textColor: 'text-accent',
    },
    considering: {
      label: t('status.complaint.considering'),
      dotColor: 'bg-gold',
      textColor: 'text-gold-text',
    },
    in_progress: {
      label: t('status.complaint.in_progress'),
      dotColor: 'bg-accent',
      textColor: 'text-accent',
    },
    resolved: {
      label: t('status.complaint.resolved'),
      dotColor: 'bg-success',
      textColor: 'text-success',
    },
  };

  const item = config[status] || config.received;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide ${item.textColor} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
      <span>{item.label}</span>
    </span>
  );
};

export const NewsCategoryBadge: React.FC<{
  category: NewsCategory;
  regulationType?: RegulationSubType | null;
  className?: string;
}> = ({
  category,
  regulationType,
  className = '',
}) => {
  const { t } = useTranslation();

  const label =
    (category === 'regulation' || category === 'order') && regulationType
      ? t(`news.regulationSubTypes.${regulationType}`)
      : t(`status.newsCategory.${category}`, {
          defaultValue: t('status.newsCategory.fallback'),
        });

  return (
    <span className={`text-[11px] uppercase tracking-[0.16em] font-medium text-gold-text ${className}`}>
      {label}
    </span>
  );
};
