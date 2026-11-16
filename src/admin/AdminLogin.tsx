/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { Emblem } from '../components/common/Emblem';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';

export const AdminLogin: React.FC = () => {
  const { login, loading, user, isAuthorized, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md bg-surface-elevated border border-gold-border/40 p-8 rounded-sm shadow-editorial text-center space-y-6">
        <Emblem size={64} className="mx-auto" />

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-gold-text font-semibold">
            ADMINISTRATION PORTAL
          </span>
          <h1 className="font-serif text-2xl font-semibold text-heading">
            ระบบจัดการองค์การนักเรียน
          </h1>
          <p className="text-xs text-text-muted">
            {SITE_CONFIG.schoolName}
          </p>
        </div>

        {user && !isAuthorized ? (
          <div className="p-4 bg-error-bg border border-error/30 rounded-sm text-xs text-error space-y-3">
            <p className="font-medium">
              อีเมล <strong>{user.email}</strong> ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              กรุณาติดต่อ Super Admin ({SITE_CONFIG.bootstrapAdmins[0]}) เพื่อเพิ่มสิทธิ์เข้าใช้งาน
            </p>
            <button
              onClick={() => logout()}
              className="px-4 py-1.5 bg-brand text-brand-contrast text-xs rounded-sm hover:bg-brand-hover transition-colors"
            >
              สลับบัญชี Google
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <button
              onClick={() => login()}
              disabled={loading}
              className="w-full py-3 px-4 bg-brand text-brand-contrast hover:bg-brand-hover transition-colors rounded-sm text-xs font-medium flex items-center justify-center gap-3 shadow-editorial-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="var(--brand-google-red)" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="var(--brand-google-blue)" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="var(--brand-google-yellow)" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                <path fill="var(--brand-google-green)" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z" />
              </svg>
              <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google Account'}</span>
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-gold-border/20">
          <Link to="/" className="text-xs text-gold-text hover:underline">
            ← กลับสู่หน้าหลักเว็บไซต์
          </Link>
        </div>
      </div>
    </div>
  );
};
