/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Emblem } from './Emblem';

export const Preloader: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => {
    // Show only once on initial device visit so repeat mobile/iPad opens are instant (0ms)
    if (typeof window !== 'undefined') {
      try {
        const seen =
          localStorage.getItem('desup_preloader_seen') ||
          sessionStorage.getItem('desup_preloader_seen');
        return !seen;
      } catch {
        return false;
      }
    }
    return false;
  });

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('desup_preloader_seen', 'true');
      sessionStorage.setItem('desup_preloader_seen', 'true');
    } catch {
      // Ignore storage error
    }
  };

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 350);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{
            y: '-100%',
            transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
          }}
          onClick={dismiss}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#2A1245] text-[#FAF7F0] select-none cursor-pointer"
        >
          {/* Subtle Thai gold line motif */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4"
            >
              <Emblem size={68} animate />
            </motion.div>

            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <h1 className="font-serif text-2xl text-[#FAF7F0] tracking-wide mb-1">
                องค์การนักเรียน
              </h1>
              <p className="text-xs tracking-[0.25em] text-[#D9B867] uppercase">
                โรงเรียนสาธิตมหาวิทยาลัยพะเยา
              </p>
            </motion.div>

            {/* Subtle loading line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
              className="h-[1.5px] bg-[#B8923A] mt-6"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
