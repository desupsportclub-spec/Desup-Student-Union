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
            WebkitTextStroke: '2px #B8923A',
            color: 'transparent'
          }}
        >
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Emblem size={64} />
        </div>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#1B1226] mb-3">
        หน้านี้หายไปเหมือนการบ้านที่ลืมส่ง
      </h1>

      <p className="text-xs md:text-sm text-[#1B1226]/60 max-w-md mx-auto mb-8 leading-relaxed">
        หน้าที่คุณกำลังค้นหาอาจถูกย้าย เปลี่ยนชื่อ หรือไม่มีอยู่จริงในระบบ
        ลองตรวจสอบที่อยู่ URL หรือกดปุ่มด้านล่างเพื่อกลับสู่หน้าหลัก
      </p>

      <Link
        to="/"
        className="px-8 py-3 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors shadow-editorial inline-flex items-center gap-2"
      >
        <span>← กลับสู่หน้าหลัก</span>
      </Link>
    </div>
  );
};
