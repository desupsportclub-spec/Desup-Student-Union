/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';

export interface SuccessCheckProps {
  size?: number;
  className?: string;
}

export function SuccessCheck({ size = 120, className = '' }: SuccessCheckProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        className={className}
        aria-label="สำเร็จ"
        role="img"
      >
        <path
          d="M 38 62 L 54 78 L 86 44"
          stroke="#2F9E6B"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="สำเร็จ"
      role="img"
    >
      {/* 1. เครื่องหมายถูกสีเขียว วาดจากซ้ายไปขวา ใช้ 0.5 วิ */}
      <motion.path
        d="M 38 62 L 54 78 L 86 44"
        stroke="#2F9E6B"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: 0.05 },
        }}
      />

      {/* 2. วงกลมเริ่มหลังเครื่องหมายถูกเสร็จ (delay 0.6s) วาดตามเข็มนาฬิกาแล้วจางหาย */}
      <motion.circle
        cx="60"
        cy="60"
        r="50"
        stroke="#2F9E6B"
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 60 60)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 1.9,
          delay: 0.6,
          times: [0, 0.74, 0.85, 1],
          ease: [0.65, 0, 0.35, 1],
        }}
      />
    </svg>
  );
}

export default SuccessCheck;
