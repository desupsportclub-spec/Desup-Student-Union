/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SuccessCheck } from '../SuccessCheck';
import { CornerBracket } from './Ornament';

interface SuccessFeedbackModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}

export const SuccessFeedbackModal: React.FC<SuccessFeedbackModalProps> = ({
  open,
  title,
  description,
  onClose,
}) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-overlay-backdrop backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-gold-border/60 p-8 md:p-10 rounded-sm shadow-2xl max-w-md w-full text-center space-y-5 relative"
          >
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <div className="flex justify-center">
              <SuccessCheck size={120} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="space-y-2"
            >
              <h3 className="font-serif text-xl font-semibold text-heading">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-text-muted leading-relaxed">
                  {description}
                </p>
              )}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors"
                >
                  {t('site.ok')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
