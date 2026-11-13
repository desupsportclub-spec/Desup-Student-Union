/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BudgetYear, ComplaintItem } from '../types';
import { formatNumber, formatBaht } from '../lib/format';
import { SectionEyebrow } from '../components/common/Ornament';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSiteSettings } from '../context/SiteSettingsContext';

const TYPE_LABELS: Record<string, string> = {
  complaint: 'เรื่องร้องเรียนทั่วไป',
  corruption: 'เบาะแสทุจริต/ความโปร่งใส',
  inquiry: 'ติดต่อสอบถามข้อมูล',
  suggestion: 'ข้อเสนอแนะพัฒนาโรงเรียน',
  compliment: 'เรื่องชมเชยการทำงาน',
  other: 'อื่น ๆ'
};

const CHART_COLORS = ['#4B1F7A', '#B8923A', '#6B3FA0', '#9C7A2B', '#2A1245', '#D9B867'];

export const Transparency: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [budgetYear, setBudgetYear] = useState<BudgetYear | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([academicYearTH]);
  const [selectedYearTH, setSelectedYearTH] = useState<string>(academicYearTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedYearTH((prev) => prev || academicYearTH);
  }, [academicYearTH]);

  // Fetch available budget years dynamically from Firestore
  useEffect(() => {
    async function fetchBudgetYears() {
      try {
        const snap = await getDocs(collection(db, 'budgets'));
        const yearsSet = new Set<string>();
        snap.forEach(d => {
          yearsSet.add(d.id);
        });
        yearsSet.add(academicYearTH);
        const sorted = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
        setAvailableYears(sorted);
      } catch (err) {
        console.warn("Could not fetch budget years:", err);
        setAvailableYears([academicYearTH]);
      }
    }
    fetchBudgetYears();
  }, [academicYearTH]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch complaints if permitted (admin) without blocking budget load for public users
        try {
          const compSnap = await getDocs(collection(db, 'complaints'));
          const compList: ComplaintItem[] = [];
          compSnap.forEach((d) => {
            compList.push({ id: d.id, ...d.data() } as ComplaintItem);
          });
          setComplaints(compList);
        } catch {
          setComplaints([]);
        }

        // Fetch budget for the selected year
        const budgetDoc = await getDoc(doc(db, 'budgets', selectedYearTH));
        if (budgetDoc.exists()) {
          setBudgetYear({ id: budgetDoc.id, ...budgetDoc.data() } as BudgetYear);
        } else {
          setBudgetYear({
            yearTH: selectedYearTH,
            totalBudget: 0,
            items: []
          });
        }
      } catch (err) {
        console.warn("Could not load transparency data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (selectedYearTH) {
      loadData();
    }
  }, [selectedYearTH]);

  // Aggregate Complaint Statistics
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress' || c.status === 'considering').length;

  const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Donut chart data by complaint type
  const typeCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });

  const donutData = Object.keys(typeCounts).map((key) => ({
    name: TYPE_LABELS[key] || key,
    value: typeCounts[key]
  }));

  // Budget calculations
  const totalSpent = budgetYear?.items?.reduce((sum, item) => sum + (item.spent || 0), 0) || 0;
  const totalBudget = budgetYear?.totalBudget || 0;
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-10 sm:space-y-16">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText="TRANSPARENCY & BUDGET" thText="ความโปร่งใสและงบประมาณ" />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226] mt-2">
            รายงานการดำเนินงานและงบประมาณ
          </h1>
          <p className="text-xs md:text-sm text-[#1B1226]/70 mt-1">
            เปิดเผยสถิติเรื่องร้องเรียน ผลการพิจารณา และการจัดสรรงบประมาณกิจกรรมนักเรียน
          </p>
        </div>

        {/* Clean Academic Year Select Dropdown */}
        <div className="flex items-center gap-2.5 text-xs">
          <label htmlFor="transparency-year-select" className="text-[#9C7A2B] font-medium whitespace-nowrap">
            ปีการศึกษา:
          </label>
          <select
            id="transparency-year-select"
            value={selectedYearTH}
            onChange={(e) => setSelectedYearTH(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#B8923A]/50 rounded-sm text-[#2A1245] font-serif font-semibold focus:outline-none focus:border-[#4B1F7A] shadow-editorial-sm"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                ปีการศึกษา {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Part 1: Complaint Statistics */}
      <div className="space-y-8">
        <div className="border-b border-[#4B1F7A]/15 pb-2">
          <h2 className="font-serif text-2xl font-semibold text-[#2A1245]">
            สถิติการรับเรื่องร้องเรียนและข้อเสนอแนะ
          </h2>
          <p className="text-xs text-[#1B1226]/60">
            ข้อมูลอัปเดตแบบเรียลไทม์จากระบบรับเรื่องร้องเรียนขององค์การนักเรียน
          </p>
        </div>

        {/* 4 Summary Metric Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-3.5 sm:p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#9C7A2B]">เรื่องทั้งหมด</span>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#2A1245] mt-1 tabular-numbers">
              {formatNumber(totalCount)}
            </div>
            <p className="text-[10px] text-[#1B1226]/60 mt-1">สะสมตลอดปีการศึกษา</p>
          </div>

          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-3.5 sm:p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800">เสร็จสิ้นแล้ว</span>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#2F6B4F] mt-1 tabular-numbers">
              {formatNumber(resolvedCount)}
            </div>
            <p className="text-[10px] text-[#1B1226]/60 mt-1">คิดเป็น {resolvedPercent}% ของเรื่องทั้งหมด</p>
          </div>

          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-3.5 sm:p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#6B3FA0]">กำลังดำเนินการ</span>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#4B1F7A] mt-1 tabular-numbers">
              {formatNumber(inProgressCount)}
            </div>
            <p className="text-[10px] text-[#1B1226]/60 mt-1">อยู่ระหว่างตรวจสอบ/ประสานงาน</p>
          </div>

          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-3.5 sm:p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#9C7A2B]">ระยะเวลาเฉลี่ย</span>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#9C7A2B] mt-1 tabular-numbers">
              3-5
            </div>
            <p className="text-[10px] text-[#1B1226]/60 mt-1">วันทำการในการตอบกลับ</p>
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-[#FAF7F0] border border-[#B8923A]/30 p-6 rounded-sm shadow-editorial">
          <h3 className="font-serif text-lg font-semibold text-[#1B1226] mb-4">
            สัดส่วนเรื่องร้องเรียนและข้อเสนอแนะแยกตามประเภท
          </h3>

          {donutData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Donut Chart */}
              <div className="md:col-span-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2A1245',
                        color: '#FAF7F0',
                        border: 'none',
                        borderRadius: '2px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Breakdown */}
              <div className="md:col-span-6 space-y-2 text-xs">
                {donutData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-stone-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-[#1B1226] font-medium">{entry.name}</span>
                    </div>
                    <span className="text-[#9C7A2B] font-mono font-bold tabular-numbers">{entry.value} เรื่อง</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-stone-500 border border-dashed border-[#4B1F7A]/20 rounded-sm bg-white/40">
              <p className="font-serif text-sm text-[#2A1245]">ยังไม่มีข้อมูลเรื่องร้องเรียนในระบบ</p>
              <p className="mt-1">สถิติและแผนภูมิจะแสดงผลอัตโนมัติเมื่อมีข้อมูลในระบบ</p>
            </div>
          )}
        </div>
      </div>

      {/* Part 2: Budget Breakdown */}
      <div className="space-y-8">
        <div className="border-b border-[#4B1F7A]/15 pb-2">
          <h2 className="font-serif text-2xl font-semibold text-[#2A1245]">
            งบประมาณกิจกรรมนักเรียน ประจำปีการศึกษา {selectedYearTH}
          </h2>
          <p className="text-xs text-[#1B1226]/60">
            สรุปการขอรับจัดสรรงบประมาณ การอนุมัติ และยอดการใช้จ่ายจริง
          </p>
        </div>

        {/* 3 Budget Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#9C7A2B]">งบประมาณที่ได้รับจัดสรร</span>
            <div className="font-serif text-2xl font-medium text-[#2A1245] mt-1 tabular-numbers">
              {formatBaht(totalBudget)}
            </div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#4B1F7A]">เบิกจ่ายจริงแล้ว</span>
            <div className="font-serif text-2xl font-medium text-[#4B1F7A] mt-1 tabular-numbers">
              {formatBaht(totalSpent)}
            </div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 rounded-sm shadow-editorial-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#2F6B4F]">งบประมาณคงเหลือ</span>
            <div className="font-serif text-2xl font-medium text-[#2F6B4F] mt-1 tabular-numbers">
              {formatBaht(remainingBudget)}
            </div>
          </div>
        </div>

        {/* Budget Items Table */}
        <div className="border border-[#4B1F7A]/15 bg-[#FAF7F0] rounded-sm shadow-editorial overflow-hidden">
          <div className="p-4 bg-[#EDE6F5]/40 border-b border-[#4B1F7A]/15 flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[#1B1226]">
              รายการกิจกรรมและการเบิกจ่าย
            </h3>
            <span className="text-xs text-[#9C7A2B]">
              รวม {budgetYear?.items?.length || 0} รายการ
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-stone-500">
              กำลังโหลดข้อมูลงบประมาณ...
            </div>
          ) : budgetYear?.items && budgetYear.items.length > 0 ? (
            <>
              {/* Mobile Budget Item Cards */}
              <div className="md:hidden divide-y divide-[#4B1F7A]/10">
                {budgetYear.items.map((item, index) => (
                  <div key={index} className="p-4 space-y-2.5">
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-[#1B1226]">
                        {item.activity}
                      </h4>
                      {item.date && (
                        <p className="text-[11px] text-[#1B1226]/60 mt-0.5">{item.date}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#4B1F7A]/10 text-[11px]">
                      <div>
                        <span className="text-[#1B1226]/55 block">งบที่ขอเสนอ</span>
                        <span className="font-mono tabular-numbers text-[#1B1226]/80">{formatBaht(item.requested)}</span>
                      </div>
                      <div>
                        <span className="text-[#1B1226]/55 block">งบที่อนุมัติ</span>
                        <span className="font-mono tabular-numbers text-[#2A1245] font-medium">{formatBaht(item.approved)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#1B1226]/55 block">งบที่ใช้จริง</span>
                        <span className="font-mono tabular-numbers text-[#4B1F7A] font-semibold">{formatBaht(item.spent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EDE6F5]/20 border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                    <tr>
                      <th className="py-3 px-4">ชื่อโครงการ/กิจกรรม</th>
                      <th className="py-3 px-4">ช่วงเวลาดำเนินการ</th>
                      <th className="py-3 px-4 text-right">งบที่ขอเสนอ</th>
                      <th className="py-3 px-4 text-right">งบที่อนุมัติ</th>
                      <th className="py-3 px-4 text-right">งบที่ใช้จริง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4B1F7A]/10">
                    {budgetYear.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#EDE6F5]/20 transition-colors">
                        <td className="py-3.5 px-4 font-serif text-sm font-semibold text-[#1B1226]">
                          {item.activity}
                        </td>
                        <td className="py-3.5 px-4 text-[#1B1226]/60">
                          {item.date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-numbers text-[#1B1226]/70">
                          {formatBaht(item.requested)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-numbers text-[#2A1245] font-medium">
                          {formatBaht(item.approved)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-numbers text-[#4B1F7A] font-semibold">
                          {formatBaht(item.spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#1B1226]/60 space-y-1">
              <p className="font-serif text-base text-[#2A1245]">ยังไม่มีรายการงบประมาณที่บันทึกในปีการศึกษานี้</p>
              <p>สามารถบันทึกรายการกิจกรรมและงบประมาณได้ในหน้าผู้ดูแลระบบ (Admin)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
