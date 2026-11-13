/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BudgetYear, BudgetItemEntry } from '../types';
import { formatBaht } from '../lib/format';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SuccessFeedbackModal } from '../components/common/SuccessFeedbackModal';

export const AdminBudgets: React.FC = () => {
  const { academicYearTH } = useSiteSettings();
  const [selectedYear, setSelectedYear] = useState<string>(academicYearTH);
  const [yearsList, setYearsList] = useState<string[]>([academicYearTH]);
  const [newYearInput, setNewYearInput] = useState('');
  const [showAddYear, setShowAddYear] = useState(false);

  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [items, setItems] = useState<BudgetItemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');

  useEffect(() => {
    setSelectedYear((prev) => prev || academicYearTH);
  }, [academicYearTH]);

  const fetchYearsList = async () => {
    try {
      const snap = await getDocs(collection(db, 'budgets'));
      const setYears = new Set<string>();
      snap.forEach((d) => setYears.add(d.id));
      setYears.add(academicYearTH);
      const sorted = Array.from(setYears).sort((a, b) => b.localeCompare(a));
      setYearsList(sorted);
    } catch (err) {
      console.warn('Could not load budget years:', err);
      setYearsList([academicYearTH]);
    }
  };

  useEffect(() => {
    fetchYearsList();
  }, [academicYearTH]);

  const handleAddNewYear = () => {
    const yr = newYearInput.trim();
    if (!yr || !/^\d{4}$/.test(yr)) {
      alert("กรุณาระบุปีการศึกษาเป็นตัวเลข 4 หลัก เช่น 2570");
      return;
    }
    if (!yearsList.includes(yr)) {
      setYearsList(prev => [yr, ...prev].sort((a, b) => b.localeCompare(a)));
    }
    setSelectedYear(yr);
    setNewYearInput('');
    setShowAddYear(false);
  };

  const handleDeleteYear = async () => {
    if (!selectedYear) return;
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบข้อมูลงบประมาณปีการศึกษา ${selectedYear} ทั้งหมดหรือไม่?`)) return;

    try {
      await deleteDoc(doc(db, 'budgets', selectedYear));
      setTotalBudget(0);
      setItems([]);
      await fetchYearsList();
      if (selectedYear !== academicYearTH) {
        setSelectedYear(academicYearTH);
      }
      setSuccessModalTitle(`ลบข้อมูลงบประมาณปีการศึกษา ${selectedYear} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Delete budget year failed:', err);
    }
  };

  useEffect(() => {
    async function loadBudget() {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'budgets', selectedYear));
        if (snap.exists()) {
          const data = snap.data() as BudgetYear;
          setTotalBudget(data.totalBudget || 0);
          setItems(data.items || []);
        } else {
          setTotalBudget(0);
          setItems([]);
        }
      } catch (err) {
        console.warn("Could not load budget:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBudget();
  }, [selectedYear]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        activity: '',
        date: '',
        requested: 0,
        approved: 0,
        spent: 0
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof BudgetItemEntry, val: string | number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const budgetDoc: BudgetYear = {
        yearTH: selectedYear,
        totalBudget: Number(totalBudget),
        items
      };
      await setDoc(doc(db, 'budgets', selectedYear), budgetDoc);
      await fetchYearsList();
      setSuccessModalTitle(`บันทึกงบประมาณประจำปีการศึกษา ${selectedYear} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error("Save budget failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalApproved = items.reduce((sum, item) => sum + (Number(item.approved) || 0), 0);
  const totalSpent = items.reduce((sum, item) => sum + (Number(item.spent) || 0), 0);
  const remainingBudget = Number(totalBudget) - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#4B1F7A]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#2A1245]">
            จัดการงบประมาณและความโปร่งใส
          </h1>
          <p className="text-xs text-[#1B1226]/60">
            บันทึกการจัดสรรงบประมาณกิจกรรมนักเรียนและการเบิกจ่ายจริง
          </p>
        </div>

        {/* Clean Year Dropdown & Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label htmlFor="admin-budget-year" className="text-[#9C7A2B] font-medium whitespace-nowrap">
            ปีการศึกษา:
          </label>
          <select
            id="admin-budget-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#B8923A]/60 rounded-sm text-[#2A1245] font-serif font-semibold focus:outline-none focus:border-[#4B1F7A]"
          >
            {yearsList.map((yr) => (
              <option key={yr} value={yr}>
                ปีการศึกษา {yr}
              </option>
            ))}
          </select>

          {!showAddYear ? (
            <button
              type="button"
              onClick={() => setShowAddYear(true)}
              className="px-3 py-1.5 text-xs border border-dashed border-[#B8923A] text-[#9C7A2B] hover:bg-[#EDE6F5] rounded-sm transition-colors whitespace-nowrap"
            >
              + เพิ่มปีการศึกษา
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-white p-1 border border-[#B8923A] rounded-sm">
              <input
                type="text"
                placeholder="เช่น 2570"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                maxLength={4}
                className="w-16 px-1.5 py-0.5 text-xs border rounded-sm"
              />
              <button
                type="button"
                onClick={handleAddNewYear}
                className="px-2 py-0.5 bg-[#4B1F7A] text-white rounded text-[11px]"
              >
                เพิ่ม
              </button>
              <button
                type="button"
                onClick={() => setShowAddYear(false)}
                className="text-stone-400 hover:text-stone-700 px-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDeleteYear}
            className="px-3 py-1.5 text-xs border border-red-200 text-[#9B1C31] hover:bg-red-50 rounded-sm transition-colors whitespace-nowrap"
            title="ลบข้อมูลงบประมาณปีนี้"
          >
            ลบปี {selectedYear}
          </button>
        </div>
      </div>

      {/* Summary Box */}
      {loading && (
        <div className="text-xs text-[#9C7A2B]">กำลังโหลดข้อมูลงบประมาณ...</div>
      )}
      <div className="bg-white p-5 border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2A1245] mb-1">
              งบประมาณที่ได้รับจัดสรรรวมทั้งปี (บาท)
            </label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="text-base font-bold font-mono input-underline w-48 text-[#4B1F7A]"
            />
          </div>

          <div className="flex flex-wrap gap-6 text-xs border-t sm:border-t-0 pt-3 sm:pt-0">
            <div>
              <span className="text-stone-500 block">งบที่อนุมัติรวม:</span>
              <span className="font-bold font-mono text-sm text-[#2A1245]">{formatBaht(totalApproved)}</span>
            </div>
            <div>
              <span className="text-stone-500 block">เบิกจ่ายจริงแล้ว:</span>
              <span className="font-bold font-mono text-sm text-[#4B1F7A]">{formatBaht(totalSpent)}</span>
            </div>
            <div>
              <span className="text-stone-500 block">งบคงเหลือ:</span>
              <span className="font-bold font-mono text-sm text-[#2F6B4F]">{formatBaht(remainingBudget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-[#4B1F7A]/15 rounded-sm shadow-editorial-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-[#2A1245]">
            รายการกิจกรรมในงบประมาณ ({items.length} รายการ)
          </h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-1.5 bg-[#FAF7F0] border border-[#B8923A] text-xs font-medium text-[#2A1245] hover:bg-[#EDE6F5] rounded-sm"
          >
            + เพิ่มรายการกิจกรรม
          </button>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#4B1F7A]/10 text-[#9C7A2B] uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-2.5 px-3">ชื่อโครงการ / กิจกรรม</th>
                  <th className="py-2.5 px-3">ช่วงเวลา</th>
                  <th className="py-2.5 px-3 text-right">งบที่ขอ (บาท)</th>
                  <th className="py-2.5 px-3 text-right">งบที่อนุมัติ (บาท)</th>
                  <th className="py-2.5 px-3 text-right">ใช้จ่ายจริง (บาท)</th>
                  <th className="py-2.5 px-3 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.activity}
                        onChange={(e) => handleUpdateItem(idx, 'activity', e.target.value)}
                        placeholder="ชื่อกิจกรรม"
                        className="w-full border p-1 rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 w-32">
                      <input
                        type="text"
                        value={item.date}
                        onChange={(e) => handleUpdateItem(idx, 'date', e.target.value)}
                        placeholder="เช่น พ.ย. 69"
                        className="w-full border p-1 rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 w-28">
                      <input
                        type="number"
                        value={item.requested}
                        onChange={(e) => handleUpdateItem(idx, 'requested', Number(e.target.value))}
                        className="w-full border p-1 rounded text-xs text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 w-28">
                      <input
                        type="number"
                        value={item.approved}
                        onChange={(e) => handleUpdateItem(idx, 'approved', Number(e.target.value))}
                        className="w-full border p-1 rounded text-xs text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 w-28">
                      <input
                        type="number"
                        value={item.spent}
                        onChange={(e) => handleUpdateItem(idx, 'spent', Number(e.target.value))}
                        className="w-full border p-1 rounded text-xs text-right font-mono font-bold text-[#4B1F7A]"
                      />
                    </td>
                    <td className="py-2 px-3 text-center w-12">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-700 hover:text-red-900 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-500">
            ยังไม่มีรายการกิจกรรม กด "+ เพิ่มรายการกิจกรรม" เพื่อเริ่มบันทึก
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-8 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-sm hover:bg-[#2A1245] transition-colors shadow-sm"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกงบประมาณทั้งหมด'}
          </button>
        </div>
      </div>

      <SuccessFeedbackModal
        open={!!successModalTitle}
        title={successModalTitle}
        onClose={() => setSuccessModalTitle('')}
      />
    </div>
  );
};
