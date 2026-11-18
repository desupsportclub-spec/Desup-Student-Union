/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SpeakerHigh, SpeakerSlash, List, X } from '@phosphor-icons/react';
import { useAdminAuth } from './AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { Emblem } from '../components/common/Emblem';
import {
  ComplaintAlertsProvider,
  usePendingComplaints,
} from './ComplaintAlertsContext';
import { FirstLoginAlertsModal } from '../components/admin/FirstLoginAlertsModal';
import { NewComplaintToast } from '../components/admin/NewComplaintToast';
import { installAudioUnlock } from '../lib/alertSound';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import {
  DashboardIcon,
  NewsIcon,
  CalendarIcon,
  DocumentIcon,
  UsersIcon,
  ComplaintsIcon,
  BannersIcon,
  SettingsIcon,
  SecurityIcon
} from '../components/admin/AdminIcons';

const PendingBadge: React.FC<{ count: number; pulseTick: number }> = ({ count, pulseTick }) => {
  if (count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);

  return (
    <span className="relative ml-auto inline-flex items-center justify-center shrink-0">
      {pulseTick > 0 && (
        <span
          key={`ring-${pulseTick}`}
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-error pointer-events-none animate-badge-ring"
        />
      )}
      <span
        key={`badge-${pulseTick}`}
        className={`h-5 min-w-[20px] px-1.5 rounded-full bg-error text-brand-contrast text-[11px] font-bold leading-none inline-flex items-center justify-center tabular-nums ${
          pulseTick > 0 ? 'animate-badge-pop' : ''
        }`}
      >
        {display}
      </span>
    </span>
  );
};

const AdminLayoutShell: React.FC = () => {
  const { user, role, logout, isAdmin } = useAdminAuth();
  const { pendingCount, pulseTick, soundEnabled, toggleSound, indexError } = usePendingComplaints();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    installAudioUnlock();
  }, []);

  if (!user) return null;

  const roleLabel =
    role === 'super_admin' ? 'Super Admin' :
    role === 'admin' ? 'Admin' : 'Editor';

  const roleBadgeColor =
    role === 'super_admin' ? 'bg-brand text-brand-contrast' :
    role === 'admin' ? 'bg-gold text-anchor-bg' : 'bg-brand-soft text-accent';

  const navItems = [
    { path: '/admin', label: 'ภาพรวมระบบ', icon: <DashboardIcon />, exact: true },
    { path: '/admin/banners', label: 'แบนเนอร์หน้าแรก', icon: <BannersIcon /> },
    { path: '/admin/news', label: 'จัดการข่าวสาร', icon: <NewsIcon /> },
    { path: '/admin/events', label: 'ปฏิทินกิจกรรม', icon: <CalendarIcon /> },
    { path: '/admin/downloads', label: 'เอกสารดาวน์โหลด', icon: <DocumentIcon /> },
    { path: '/admin/people', label: 'บุคลากร/ทำเนียบ', icon: <UsersIcon /> },
    { path: '/admin/complaints', label: 'เรื่องร้องเรียน/เสนอแนะ', icon: <ComplaintsIcon />, showPendingBadge: true },
    ...(isAdmin ? [
      { path: '/admin/settings', label: 'ตั้งค่าเว็บไซต์', icon: <SettingsIcon /> },
      { path: '/admin/users', label: 'ผู้ดูแลระบบและสิทธิ์', icon: <SecurityIcon /> }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-bg-alt flex text-text font-sans">
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-elevated border-r border-gold-border/20 shrink-0 justify-between">
        <div>
          {/* Header with Emblem */}
          <div className="p-6 border-b border-gold-border/15 flex items-center gap-3">
            <Emblem size={40} />
            <div>
              <h2 className="font-serif text-sm font-semibold text-heading leading-tight">
                องค์การนักเรียน
              </h2>
              <span className="text-[10px] text-gold-text uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="p-4 border-b border-gold-border/15 bg-surface flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand text-brand-contrast flex items-center justify-center font-bold text-xs uppercase">
              {user.displayName?.[0] || user.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-heading truncate">
                {user.displayName || user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${roleBadgeColor}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-xs rounded-sm transition-colors ${
                    active
                      ? 'bg-brand-soft text-accent font-semibold border-l-2 border-gold'
                      : 'text-text-muted hover:bg-bg-alt hover:text-heading'
                  }`}
                >
                  <span className={`${active ? 'text-accent' : 'text-text-muted'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {item.showPendingBadge && (
                    <PendingBadge count={pendingCount} pulseTick={pulseTick} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Actions */}
        <div className="p-4 border-t border-gold-border/15 space-y-2.5">
          {/* สลับโหมดสว่าง / มืด สำหรับผู้ดูแลระบบ */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="text-[11px] text-text-muted font-medium">ธีมหน้าจอ</span>
            <ThemeSwitcher variant="dropdown" dropUp className="shrink-0" />
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs border border-gold-border/25 bg-surface hover:bg-brand-soft/60 text-heading rounded-sm transition-colors"
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเรื่องร้องเรียน' : 'เปิดเสียงแจ้งเตือนเรื่องร้องเรียน'}
          >
            <span className="inline-flex items-center gap-2">
              {soundEnabled ? (
                <SpeakerHigh size={15} weight="light" className="text-accent" />
              ) : (
                <SpeakerSlash size={15} weight="light" className="text-text-muted" />
              )}
              <span>เสียงแจ้งเตือน</span>
            </span>
            <span
              className={`text-[10px] font-semibold ${
                soundEnabled ? 'text-success' : 'text-text-muted'
              }`}
            >
              {soundEnabled ? 'เปิด' : 'ปิด'}
            </span>
          </button>
          <Link
            to="/"
            className="block text-center text-xs py-1.5 border border-gold-border/25 text-text-muted hover:text-accent hover:bg-bg-alt rounded-sm transition-colors"
          >
            ← ดูหน้าเว็บจริง
          </Link>
          <button
            onClick={() => logout()}
            className="w-full text-center text-xs py-1.5 bg-error-bg text-error hover:bg-error/15 rounded-sm transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-surface-elevated border-b border-gold-border/20 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Emblem size={28} />
            <span className="font-serif text-sm font-semibold text-heading truncate">
              ระบบจัดการหลังบ้าน
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSwitcher variant="dropdown" />
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-expanded={mobileSidebarOpen}
              aria-label={
                pendingCount > 0
                  ? `เปิดเมนูผู้ดูแลระบบ (มีเรื่องร้องเรียนค้าง ${pendingCount} เรื่อง)`
                  : 'เปิดเมนูผู้ดูแลระบบ'
              }
              className="relative inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-gold-border/30 rounded-sm text-heading bg-surface hover:bg-bg-alt"
            >
              {mobileSidebarOpen ? <X size={15} /> : <List size={15} />}
              <span>เมนู</span>
              {pendingCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-elevated"
                />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-surface-elevated border-b border-gold-border/25 p-4 space-y-2">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 text-xs py-2 px-3 rounded-sm ${
                    active ? 'bg-brand-soft text-accent font-semibold' : 'text-text-muted hover:bg-brand-soft/60 hover:text-heading'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {item.showPendingBadge && (
                    <PendingBadge count={pendingCount} pulseTick={pulseTick} />
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gold-border/15 space-y-2">
              <div className="flex items-center justify-between gap-2 px-1 py-1">
                <span className="text-xs text-text-muted">ธีมหน้าจอ</span>
                <ThemeSwitcher variant="dropdown" dropUp />
              </div>
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
                className="w-full flex items-center justify-between px-3 py-2 text-xs border border-gold-border/25 bg-surface rounded-sm text-heading"
              >
                <span className="inline-flex items-center gap-2">
                  {soundEnabled ? (
                    <SpeakerHigh size={15} weight="light" className="text-accent" />
                  ) : (
                    <SpeakerSlash size={15} weight="light" className="text-text-muted" />
                  )}
                  <span>เสียงแจ้งเตือน</span>
                </span>
                <span className={`text-[10px] font-semibold ${soundEnabled ? 'text-success' : 'text-text-muted'}`}>
                  {soundEnabled ? 'เปิด' : 'ปิด'}
                </span>
              </button>
              <div className="flex gap-2">
                <Link to="/" className="text-xs py-1.5 px-3 border border-gold-border/25 text-text rounded text-center flex-1 hover:bg-bg-alt">
                  ไปหน้าเว็บ
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs py-1.5 px-3 bg-error-bg text-error rounded text-center hover:bg-error/15"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="p-4 sm:p-6 md:p-10 flex-1 overflow-y-auto">
          {indexError && (
            <div className="mb-4 p-3 bg-warning-bg border-l-4 border-warning text-xs text-warning rounded-sm">
              การแจ้งเตือนเรื่องร้องเรียนแบบเรียลไทม์ต้องสร้างดัชนี (Firestore Index) เพิ่มเติม: {indexError}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* First-login summary modal & Live top-right toast */}
      <FirstLoginAlertsModal />
      <NewComplaintToast />
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  const { user, isAuthorized, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <Emblem size={48} animate />
        <p className="text-xs text-gold-text mt-4 font-serif">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <AdminLogin />;
  }

  return (
    <ComplaintAlertsProvider>
      <AdminLayoutShell />
    </ComplaintAlertsProvider>
  );
};
