/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ComplaintItem } from '../types';
import { formatNumber, formatThaiDate } from '../lib/format';
import { ComplaintStatusBadge } from '../components/common/StatusBadge';
import { useAdminAuth } from './AdminAuthContext';

export const AdminDashboard: React.FC = () => {
  const { role: _role } = useAdminAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [newsCount, setNewsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Complaints
        const compSnap = await getDocs(collection(db, 'complaints'));
        const compList: ComplaintItem[] = [];
        compSnap.forEach((d) => {
          compList.push({ id: d.id, ...d.data() } as ComplaintItem);
        });
        compList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setComplaints(compList);

        // News count
        const newsSnap = await getDocs(collection(db, 'news'));
        setNewsCount(newsSnap.size);

        // Events count
        const eventsSnap = await getDocs(collection(db, 'events'));
        setEventsCount(eventsSnap.size);

        // Visits
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        if (settingsSnap.exists()) {
          setTotalVisits(settingsSnap.data().totalVisits || 0);
        }
      } catch (err) {
        console.warn("Could not load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const pendingComplaints = complaints.filter(c => c.status === 'received' || c.status === 'considering');

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#2A1245]">
            ภาพรวมระบบบริหารจัดการ
          </h1>
          <p className="text-xs text-[#1B1226]/60 mt-1">
            ยินดีต้อนรับสู่ระบบหลังบ้าน องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา
          </p>
        </div>

        {/* Quick Link to site */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/news"
            className="px-4 py-2 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors"
          >
            + เขียนข่าวใหม่
          </Link>
          <Link
            to="/admin/complaints"
            className="px-4 py-2 bg-white border border-[#4B1F7A]/20 text-[#2A1245] text-xs font-medium rounded-sm hover:border-[#B8923A] transition-colors"
          >
            ตรวจเรื่องร้องเรียน ({pendingComplaints.length})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-[#9C7A2B] font-semibold uppercase tracking-wider">
            เรื่องร้องเรียนรอตรวจ
          </span>
          <div className="font-serif text-3xl font-bold text-[#4B1F7A] mt-2">
            {pendingComplaints.length}
          </div>
          <p className="text-[10px] text-[#1B1226]/60 mt-1">
            จากทั้งหมด {complaints.length} เรื่อง
          </p>
        </div>

        <div className="bg-white border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-[#9C7A2B] font-semibold uppercase tracking-wider">
            ข่าวสารในระบบ
          </span>
          <div className="font-serif text-3xl font-bold text-[#2A1245] mt-2">
            {newsCount}
          </div>
          <p className="text-[10px] text-[#1B1226]/60 mt-1">
            บทความและประกาศ
          </p>
        </div>

        <div className="bg-white border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-[#9C7A2B] font-semibold uppercase tracking-wider">
            กิจกรรมในปฏิทิน
          </span>
          <div className="font-serif text-3xl font-bold text-[#2A1245] mt-2">
            {eventsCount}
          </div>
          <p className="text-[10px] text-[#1B1226]/60 mt-1">
            กำหนดการตลอดปีการศึกษา
          </p>
        </div>

        <div className="bg-white border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-[#9C7A2B] font-semibold uppercase tracking-wider">
            ผู้เข้าชมเว็บไซต์
          </span>
          <div className="font-serif text-3xl font-bold text-[#9C7A2B] mt-2">
            {formatNumber(totalVisits)}
          </div>
          <p className="text-[10px] text-[#1B1226]/60 mt-1">
            ครั้งสะสม
          </p>
        </div>
      </div>

      {/* Recent Complaints Triage Table */}
      <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm overflow-hidden">
        <div className="p-4 border-b border-[#4B1F7A]/10 flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-[#2A1245]">
            เรื่องร้องเรียนล่าสุด
          </h2>
          <Link to="/admin/complaints" className="text-xs text-[#9C7A2B] hover:underline">
            ดูทั้งหมด ({complaints.length}) →
          </Link>
        </div>

        {complaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-2.5 px-4">รหัสติดตาม</th>
                  <th className="py-2.5 px-4">หัวข้อเรื่อง</th>
                  <th className="py-2.5 px-4">สถานะ</th>
                  <th className="py-2.5 px-4">วันที่ส่ง</th>
                  <th className="py-2.5 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {complaints.slice(0, 5).map((comp) => (
                  <tr key={comp.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#4B1F7A]">
                      {comp.trackingCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1B1226] max-w-xs truncate">
                      {comp.title}
                    </td>
                    <td className="py-3 px-4">
                      <ComplaintStatusBadge status={comp.status} />
                    </td>
                    <td className="py-3 px-4 text-[#1B1226]/60">
                      {formatThaiDate(comp.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to="/admin/complaints"
                        className="text-xs text-[#4B1F7A] hover:underline"
                      >
                        ตรวจดู
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#1B1226]/60">
            ยังไม่มีเรื่องร้องเรียนในระบบ
          </div>
        )}
      </div>
    </div>
  );
};
