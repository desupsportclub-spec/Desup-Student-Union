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
import { computeComplaintStats, syncComplaintStatsToSettings } from '../lib/complaintStatsSync';

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
        void syncComplaintStatsToSettings(computeComplaintStats(compList));

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-border/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-heading">
            ภาพรวมระบบบริหารจัดการ
          </h1>
          <p className="text-xs text-text-muted mt-1">
            ยินดีต้อนรับสู่ระบบผู้ดูแล องค์การนักเรียน โรงเรียนสาธิตมหาวิทยาลัยพะเยา
          </p>
        </div>

        {/* Quick Link to site */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/news"
            className="px-4 py-2 bg-brand text-brand-contrast text-xs font-medium rounded-sm hover:bg-brand-hover transition-colors"
          >
            + เขียนข่าวใหม่
          </Link>
          <Link
            to="/admin/complaints"
            className="px-4 py-2 bg-surface-elevated border border-gold-border/30 text-heading text-xs font-medium rounded-sm hover:border-gold transition-colors"
          >
            ตรวจเรื่องร้องเรียน ({pendingComplaints.length})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-surface-elevated border border-gold-border/20 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-gold-text font-semibold uppercase tracking-wider">
            เรื่องร้องเรียนรอดำเนินการ
          </span>
          <div className="font-serif text-3xl font-bold text-accent mt-2">
            {pendingComplaints.length}
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            จากทั้งหมด {complaints.length} เรื่อง
          </p>
        </div>

        <div className="bg-surface-elevated border border-gold-border/20 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-gold-text font-semibold uppercase tracking-wider">
            ข่าวสารในระบบ
          </span>
          <div className="font-serif text-3xl font-bold text-heading mt-2">
            {newsCount}
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            เรื่อง
          </p>
        </div>

        <div className="bg-surface-elevated border border-gold-border/20 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-gold-text font-semibold uppercase tracking-wider">
            กิจกรรมในปฏิทิน
          </span>
          <div className="font-serif text-3xl font-bold text-heading mt-2">
            {eventsCount}
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            กิจกรรม
          </p>
        </div>

        <div className="bg-surface-elevated border border-gold-border/20 p-5 rounded-sm shadow-editorial-sm">
          <span className="text-[11px] text-gold-text font-semibold uppercase tracking-wider">
            ผู้เข้าชมเว็บไซต์
          </span>
          <div className="font-serif text-3xl font-bold text-gold-text mt-2">
            {formatNumber(totalVisits)}
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            ครั้ง
          </p>
        </div>
      </div>

      {/* Recent Complaints Triage Table */}
      <div className="bg-surface-elevated border border-gold-border/20 rounded-sm shadow-editorial-sm overflow-hidden">
        <div className="p-4 border-b border-gold-border/15 flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-heading">
            เรื่องร้องเรียนล่าสุด
          </h2>
          <Link to="/admin/complaints" className="text-xs text-gold-text hover:underline">
            ดูทั้งหมด ({complaints.length}) →
          </Link>
        </div>

        {complaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-gold-border/15 text-gold-text uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-2.5 px-4">รหัสติดตาม</th>
                  <th className="py-2.5 px-4">หัวข้อเรื่อง</th>
                  <th className="py-2.5 px-4">สถานะ</th>
                  <th className="py-2.5 px-4">วันที่ส่ง</th>
                  <th className="py-2.5 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-border/10">
                {complaints.slice(0, 5).map((comp) => (
                  <tr key={comp.id} className="hover:bg-bg-alt/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-accent">
                      {comp.trackingCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-text max-w-xs truncate">
                      {comp.title}
                    </td>
                    <td className="py-3 px-4">
                      <ComplaintStatusBadge status={comp.status} />
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {formatThaiDate(comp.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to="/admin/complaints"
                        className="text-xs text-accent hover:underline"
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
          <div className="p-8 text-center text-xs text-text-muted">
            ยังไม่มีเรื่องร้องเรียนในระบบ
          </div>
        )}
      </div>
    </div>
  );
};
