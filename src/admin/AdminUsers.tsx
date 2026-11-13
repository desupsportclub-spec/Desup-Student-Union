/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminUser, AdminRole, AuditLogItem } from '../types';
import { useAdminAuth } from './AdminAuthContext';
import { formatThaiDateTime } from '../lib/format';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';

export const AdminUsers: React.FC = () => {
  const { user, isSuperAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [successModalTitle, setSuccessModalTitle] = useState('');

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('editor');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'admins'));
      const list: AdminUser[] = [];
      snap.forEach((d) => {
        list.push(d.data() as AdminUser);
      });
      setAdmins(list);

      if (isSuperAdmin) {
        const auditSnap = await getDocs(collection(db, 'auditLogs'));
        const logs: AuditLogItem[] = [];
        auditSnap.forEach((d) => {
          logs.push({ id: d.id, ...d.data() } as AuditLogItem);
        });
        logs.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
        setAuditLogs(logs);
      }
    } catch (err) {
      console.warn("Could not load admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg("กรุณาระบุอีเมล Google ให้ถูกต้อง");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const ref = doc(db, 'admins', cleanEmail);
      const newAdminDoc: AdminUser = {
        email: cleanEmail,
        displayName: newDisplayName.trim() || cleanEmail.split('@')[0],
        role: newRole,
        active: true,
        addedBy: user?.email || 'admin',
        addedAt: new Date().toISOString()
      };

      await setDoc(ref, newAdminDoc);

      // Record Audit Log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'grant',
        targetEmail: cleanEmail,
        toRole: newRole,
        byEmail: user?.email || 'admin',
        at: new Date().toISOString()
      });

      setIsAddModalOpen(false);
      setNewEmail('');
      setNewDisplayName('');
      await fetchUsers();
      setSuccessModalTitle(`เพิ่มสิทธิ์ผู้ดูแล ${cleanEmail} เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      console.error("Add admin failed:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเพิ่มผู้ดูแล กรุณาตรวจสอบสิทธิ์ของท่าน");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    if (admin.email.toLowerCase() === user?.email?.toLowerCase()) {
      alert("ท่านไม่สามารถระงับสิทธิ์ของบัญชีตนเองได้");
      return;
    }

    const nextState = !admin.active;
    const actionText = nextState ? "เปิดใช้งาน" : "ระงับการใช้งานชั่วคราว";

    if (!window.confirm(`คุณแน่ใจว่าต้องการ${actionText}ผู้ใช้ ${admin.email} หรือไม่?`)) return;

    try {
      await updateDoc(doc(db, 'admins', admin.email.toLowerCase()), {
        active: nextState
      });

      await addDoc(collection(db, 'auditLogs'), {
        action: nextState ? 'grant' : 'revoke',
        targetEmail: admin.email,
        fromRole: admin.role,
        toRole: nextState ? admin.role : 'inactive',
        byEmail: user?.email || 'admin',
        at: new Date().toISOString()
      });

      await fetchUsers();
      setSuccessModalTitle(nextState ? 'เปิดใช้งานบัญชีผู้ดูแลเรียบร้อยแล้ว' : 'ระงับบัญชีผู้ดูแลชั่วคราวเรียบร้อยแล้ว');
    } catch (err) {
      console.error("Update active status failed:", err);
    }
  };

  const handleRevokeAdmin = async (admin: AdminUser) => {
    if (admin.email.toLowerCase() === user?.email?.toLowerCase()) {
      alert("ท่านไม่สามารถถอนสิทธิ์ของตนเองได้");
      return;
    }

    // Check last super admin guard
    if (admin.role === 'super_admin') {
      const activeSuperAdmins = admins.filter(a => a.role === 'super_admin' && a.active);
      if (activeSuperAdmins.length <= 1) {
        alert("ไม่สามารถถอนสิทธิ์ Super Admin คนสุดท้ายของระบบได้");
        return;
      }
    }

    if (!window.confirm(`คุณแน่ใจว่าต้องการถอนสิทธิ์ผู้ดูแล ${admin.email} ถาวรใช่หรือไม่?`)) return;

    try {
      await deleteDoc(doc(db, 'admins', admin.email.toLowerCase()));

      await addDoc(collection(db, 'auditLogs'), {
        action: 'revoke',
        targetEmail: admin.email,
        fromRole: admin.role,
        byEmail: user?.email || 'admin',
        at: new Date().toISOString()
      });

      await fetchUsers();
      setSuccessModalTitle(`ถอนสิทธิ์ ${admin.email} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error("Revoke admin failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
            ผู้ดูแลระบบและสิทธิ์การเข้าถึง (RBAC)
          </h1>
          <p className="text-xs text-[#1B1226]/60">
            จัดการบัญชี Google ที่ได้รับสิทธิ์บริหารจัดการเว็บไซต์องค์การนักเรียน
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors shadow-sm self-start sm:self-auto"
        >
          + เพิ่มผู้ดูแลระบบใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#4B1F7A]/10 text-xs font-medium pb-2">
        <button
          onClick={() => setTab('users')}
          className={`pb-2 transition-colors relative ${
            tab === 'users' ? 'text-[#4B1F7A] font-semibold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>รายชื่อผู้ดูแลระบบ ({admins.length})</span>
          {tab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B8923A]" />}
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setTab('audit')}
            className={`pb-2 transition-colors relative ${
              tab === 'audit' ? 'text-[#4B1F7A] font-semibold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>ประวัติการเปลี่ยนแปลงสิทธิ์ (Audit Log)</span>
            {tab === 'audit' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B8923A]" />}
          </button>
        )}
      </div>

      {tab === 'users' && (
        <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-500">กำลังโหลด...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                  <tr>
                    <th className="py-3 px-4">ชื่อ</th>
                    <th className="py-3 px-4">อีเมล Google</th>
                    <th className="py-3 px-4">บทบาท (Role)</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4">ผู้ให้สิทธิ์</th>
                    <th className="py-3 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {admins.map((adm) => {
                    const isSelf = adm.email.toLowerCase() === user?.email?.toLowerCase();
                    return (
                      <tr key={adm.email} className="hover:bg-stone-50">
                        <td className="py-3 px-4 font-medium text-[#1B1226]">
                          {adm.displayName || adm.email.split('@')[0]}
                          {isSelf && <span className="ml-2 text-[10px] text-stone-400">(คุณ)</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#4B1F7A]">
                          {adm.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              adm.role === 'super_admin'
                                ? 'bg-[#4B1F7A] text-white'
                                : adm.role === 'admin'
                                ? 'bg-[#B8923A] text-white'
                                : 'bg-[#EDE6F5] text-[#4B1F7A]'
                            }`}
                          >
                            {adm.role === 'super_admin' ? 'Super Admin' : adm.role === 'admin' ? 'Admin' : 'Editor'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {adm.active ? (
                            <span className="text-emerald-700 font-medium">ใช้งานอยู่</span>
                          ) : (
                            <span className="text-red-600 font-medium">ระงับชั่วคราว</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-500">
                          {adm.addedBy}
                        </td>
                        <td className="py-3 px-4 text-center space-x-2">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleActive(adm)}
                                className="text-stone-600 hover:underline text-xs"
                              >
                                {adm.active ? 'ระงับ' : 'เปิดใช้'}
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleRevokeAdmin(adm)}
                                  className="text-[#9B1C31] hover:underline text-xs"
                                >
                                  ถอนสิทธิ์
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && isSuperAdmin && (
        <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">วันเวลา</th>
                  <th className="py-3 px-4">การกระทำ</th>
                  <th className="py-3 px-4">เป้าหมาย</th>
                  <th className="py-3 px-4">บทบาท</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-4 text-stone-500">
                      {formatThaiDateTime(log.at)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#2A1245]">
                      {log.action === 'grant' ? 'เพิ่ม/เปิดสิทธิ์' : log.action === 'change_role' ? 'เปลี่ยนบทบาท' : 'ถอนสิทธิ์'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#4B1F7A]">
                      {log.targetEmail}
                    </td>
                    <td className="py-2.5 px-4 text-stone-600">
                      {log.toRole || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-stone-500">
                      {log.byEmail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#B8923A]/40 max-w-md w-full p-6 space-y-5 shadow-editorial">
            <div className="flex items-center justify-between border-b border-[#4B1F7A]/15 pb-3">
              <h2 className="font-serif text-lg font-semibold text-[#2A1245]">
                เพิ่มผู้ดูแลระบบใหม่
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-800">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs border-l-2 border-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2A1245] mb-1">
                  อีเมล Google ของผู้ใช้ *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@gmail.com หรือ @up.ac.th"
                  className="w-full input-underline"
                  required
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  เมื่อเพิ่มแล้ว บุคคลนี้จะสามารถล็อกอินด้วย Google Account เพื่อเข้าสู่ระบบได้ทันที
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#2A1245] mb-1">
                  ชื่อที่แสดง (Display Name)
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="เช่น นายธนภัทร (ฝ่ายประชาสัมพันธ์)"
                  className="w-full input-underline"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2A1245] mb-1">
                  บทบาท (Role) *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full border p-2 rounded-sm"
                >
                  <option value="editor">Editor (จัดการข่าว, กิจกรรม, เอกสาร และตอบเรื่องร้องเรียน)</option>
                  {isSuperAdmin && <option value="admin">Admin (จัดการเนื้อหาทั้งหมด + เพิ่ม/ถอน Editor)</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin (สิทธิ์สูงสุด บริหารจัดการผู้ดูแลทั้งหมด)</option>}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-sm hover:bg-stone-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#4B1F7A] text-[#FAF7F0] rounded-sm hover:bg-[#2A1245]"
                >
                  {saving ? 'กำลังบันทึก...' : 'เพิ่มสิทธิ์ผู้ดูแล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessFeedbackModal
        open={!!successModalTitle}
        title={successModalTitle}
        onClose={() => setSuccessModalTitle('')}
      />
    </div>
  );
};
