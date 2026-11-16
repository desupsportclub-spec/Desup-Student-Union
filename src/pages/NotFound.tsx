/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Emblem } from '../components/common/Emblem';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center">
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
        หน้านี้หายไปเหมือนการบ้านที่ลืมส่ง
      </h1>

      <p className="text-xs md:text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
        หน้าที่คุณกำลังค้นหาอาจถูกย้าย เปลี่ยนชื่อ หรือไม่มีอยู่จริงในระบบ
        ลองตรวจสอบที่อยู่ URL หรือกดปุ่มด้านล่างเพื่อกลับสู่หน้าหลัก
      </p>

      <Link
        to="/"
        className="px-8 py-3 bg-brand text-brand-contrast text-xs font-medium rounded-full border border-gold-light/40 hover:bg-brand-hover transition-colors shadow-editorial inline-flex items-center gap-2"
      >
        <span>← กลับสู่หน้าหลัก</span>
      </Link>
    </div>
  );
};
