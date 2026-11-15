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
          className="absolute inset-0 rounded-full border-2 border-[#E5383B] pointer-events-none animate-badge-ring"
        />
      )}
      <span
        key={`badge-${pulseTick}`}
        className={`h-5 min-w-[20px] px-1.5 rounded-full bg-[#E5383B] text-white text-[11px] font-bold leading-none inline-flex items-center justify-center tabular-nums ${
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
    role === 'super_admin' ? 'bg-[#4B1F7A] text-[#FAF7F0]' :
    role === 'admin' ? 'bg-[#9C7A2B] text-[#FAF7F0]' : 'bg-[#EDE6F5] text-[#4B1F7A]';

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
    <div className="min-h-screen bg-[#F7F4EE] flex text-[#1B1226] font-sans">
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#4B1F7A]/15 shrink-0 justify-between">
        <div>
          {/* Header with Emblem */}
          <div className="p-6 border-b border-[#4B1F7A]/10 flex items-center gap-3">
            <Emblem size={40} />
            <div>
              <h2 className="font-serif text-sm font-semibold text-[#2A1245] leading-tight">
                องค์การนักเรียน
              </h2>
              <span className="text-[10px] text-[#9C7A2B] uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="p-4 border-b border-stone-100 bg-[#FAF7F0]/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#4B1F7A] text-white flex items-center justify-center font-bold text-xs uppercase">
              {user.displayName?.[0] || user.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1B1226] truncate">
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
                      ? 'bg-[#EDE6F5] text-[#4B1F7A] font-semibold border-l-2 border-[#B8923A]'
                      : 'text-[#1B1226]/75 hover:bg-stone-100 hover:text-[#2A1245]'
                  }`}
                >
                  <span className={`${active ? 'text-[#4B1F7A]' : 'text-stone-400 group-hover:text-stone-600'}`}>
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
        <div className="p-4 border-t border-[#4B1F7A]/10 space-y-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs border border-[#4B1F7A]/15 bg-[#FAF7F0] hover:bg-[#EDE6F5]/60 text-[#2A1245] rounded-sm transition-colors"
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเรื่องร้องเรียน' : 'เปิดเสียงแจ้งเตือนเรื่องร้องเรียน'}
          >
            <span className="inline-flex items-center gap-2">
              {soundEnabled ? (
                <SpeakerHigh size={15} weight="light" className="text-[#4B1F7A]" />
              ) : (
                <SpeakerSlash size={15} weight="light" className="text-stone-400" />
              )}
              <span>เสียงแจ้งเตือน</span>
            </span>
            <span
              className={`text-[10px] font-semibold ${
                soundEnabled ? 'text-emerald-700' : 'text-stone-400'
              }`}
            >
              {soundEnabled ? 'เปิด' : 'ปิด'}
            </span>
          </button>
          <Link
            to="/"
            className="block text-center text-xs py-1.5 border border-stone-200 text-[#1B1226]/70 hover:text-[#4B1F7A] hover:bg-stone-50 rounded-sm transition-colors"
          >
            ← ดูหน้าเว็บจริง
          </Link>
          <button
            onClick={() => logout()}
            className="w-full text-center text-xs py-1.5 bg-red-50 text-[#9B1C31] hover:bg-red-100 rounded-sm transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-white border-b border-[#4B1F7A]/15 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Emblem size={28} />
            <span className="font-serif text-sm font-semibold text-[#2A1245] truncate">
              ระบบจัดการหลังบ้าน
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-expanded={mobileSidebarOpen}
            aria-label={
              pendingCount > 0
                ? `เปิดเมนูผู้ดูแลระบบ (มีเรื่องร้องเรียนค้าง ${pendingCount} เรื่อง)`
                : 'เปิดเมนูผู้ดูแลระบบ'
            }
            className="relative inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-stone-300 rounded-sm text-[#2A1245] bg-white hover:bg-stone-50"
          >
            {mobileSidebarOpen ? <X size={15} /> : <List size={15} />}
            <span>เมนู</span>
            {pendingCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E5383B] ring-2 ring-white"
              />
            )}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden bg-white border-b border-[#4B1F7A]/20 p-4 space-y-2">
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
                    active ? 'bg-[#EDE6F5] text-[#4B1F7A] font-semibold' : 'hover:bg-[#EDE6F5]'
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
            <div className="pt-2 border-t space-y-2">
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
                className="w-full flex items-center justify-between px-3 py-2 text-xs border border-[#4B1F7A]/15 bg-[#FAF7F0] rounded-sm text-[#2A1245]"
              >
                <span className="inline-flex items-center gap-2">
                  {soundEnabled ? (
                    <SpeakerHigh size={15} weight="light" className="text-[#4B1F7A]" />
                  ) : (
                    <SpeakerSlash size={15} weight="light" className="text-stone-400" />
                  )}
                  <span>เสียงแจ้งเตือน</span>
                </span>
                <span className={`text-[10px] font-semibold ${soundEnabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                  {soundEnabled ? 'เปิด' : 'ปิด'}
                </span>
              </button>
              <div className="flex gap-2">
                <Link to="/" className="text-xs py-1.5 px-3 border rounded text-center flex-1">
                  ไปหน้าเว็บ
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs py-1.5 px-3 bg-red-50 text-[#9B1C31] rounded text-center"
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
            <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-xs text-amber-900 rounded-sm">
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
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center">
        <Emblem size={48} animate />
        <p className="text-xs text-[#9C7A2B] mt-4 font-serif">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
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
