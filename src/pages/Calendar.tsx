/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EventItem } from '../types';
import {
  formatThaiDate,
  getEventDateKey,
  getLocalTodayDateKey,
  getThaiDateParts,
  isEventActiveOrUpcoming,
  isEventOnDateKey,
} from '../lib/format';
import { SectionEyebrow } from '../components/common/Ornament';
import { getCachedEventsSync, loadPublishedEvents } from '../lib/publicDataService';

export const CalendarPage: React.FC = () => {
  const initialEvents = getCachedEventsSync() || [];
  const todayStr = getLocalTodayDateKey();

  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventItem[]>(() =>
    initialEvents.filter((e) => isEventOnDateKey(e, todayStr))
  );
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  useEffect(() => {
    let active = true;
    loadPublishedEvents((list) => {
      if (!active) return;
      setEvents(list);
      setSelectedDayEvents((prev) =>
        prev.length > 0 ? prev : list.filter((e) => isEventOnDateKey(e, todayStr))
      );
    }).catch((err) => {
      console.warn('Could not fetch events:', err);
    });
    return () => {
      active = false;
    };
  }, [todayStr]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const thaiDateParts = getThaiDateParts(currentDate);

  const activeOrUpcomingEvents = events.filter((e) => isEventActiveOrUpcoming(e));

  // Check events for a given day
  const getEventsForDay = (dayNum: number): EventItem[] => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter((e) => isEventOnDateKey(e, dayStr));
  };

  const handleSelectDay = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDayStr(dayStr);
    const dayEvents = getEventsForDay(dayNum);
    setSelectedDayEvents(dayEvents);
  };

  // Client-side .ics export helper
  const handleExportICS = (event: EventItem) => {
    const start = new Date(event.startAt).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = event.endAt
      ? new Date(event.endAt).toISOString().replace(/-|:|\.\d\d\d/g, "")
      : start;

    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DESUP//Student Council//TH",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const today = new Date();
  const isToday = (dayNum: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Page Header */}
      <div className="border-b border-gold-border/30 pb-6">
        <SectionEyebrow enText="CALENDAR" thText="ปฏิทินกิจกรรม" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading mt-2">
          กำหนดการและกิจกรรมนักเรียน
        </h1>
        <p className="text-xs md:text-sm text-text-muted mt-1">
          ติดตามตารางกิจกรรม โครงการ และวันสำคัญขององค์การนักเรียน
        </p>
      </div>

      {/* Desktop Split View: Month Grid (Left 8 cols) + Selected Day Panel (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Month Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-gold-border/30 p-3.5 sm:p-6 rounded-sm shadow-editorial">
          {/* Month Header Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-gold-border/20">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-heading">
              {thaiDateParts.monthFull} พ.ศ. {thaiDateParts.yearBE}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevMonth}
                className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gold-border/25 hover:border-gold text-text rounded-sm text-xs whitespace-nowrap transition-colors"
                title="เดือนก่อนหน้า"
              >
                ← เดือนก่อน
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 sm:py-2 border border-gold-border/25 hover:border-gold rounded-sm text-xs text-accent font-medium whitespace-nowrap transition-colors"
              >
                วันนี้
              </button>
              <button
                onClick={handleNextMonth}
                className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gold-border/25 hover:border-gold text-text rounded-sm text-xs whitespace-nowrap transition-colors"
                title="เดือนถัดไป"
              >
                เดือนถัดไป →
              </button>
            </div>
          </div>

          {/* Days of Week Header (Starts Sunday) */}
          <div className="grid grid-cols-7 text-center font-medium text-[11px] sm:text-xs text-gold-text pb-2 sm:pb-3 border-b border-gold-border/15">
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 sm:h-20 md:h-24 p-1 bg-bg-alt/40 rounded-sm" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = getEventsForDay(dayNum);
              const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDayStr === currentDayStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-12 sm:h-20 md:h-24 p-1 sm:p-2 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-gold bg-brand-soft/60 ring-1 ring-gold'
                      : isToday(dayNum)
                      ? 'border-accent bg-surface-elevated'
                      : 'border-gold-border/15 bg-surface-elevated hover:border-gold/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-serif ${
                        isToday(dayNum)
                          ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand text-brand-contrast flex items-center justify-center font-bold'
                          : 'text-text'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold" />
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="hidden sm:block space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[10px] truncate text-accent bg-brand-soft px-1 py-0.5 rounded-sm"
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-gold-text">+{dayEvents.length - 2} อื่น ๆ</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Panel (Right 4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-gold-border/30 p-6 rounded-sm shadow-editorial flex flex-col justify-between">
          <div>
            <div className="border-b border-gold-border/20 pb-4 mb-4">
              <span className="text-[11px] uppercase tracking-wider text-gold-text font-semibold">
                กิจกรรมของวันที่เลือก
              </span>
              <h3 className="font-serif text-lg font-semibold text-heading mt-1">
                {selectedDayStr ? formatThaiDate(selectedDayStr) : 'กรุณาเลือกวันที่'}
              </h3>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map((evt) => (
                  <div key={evt.id} className="p-4 bg-surface-elevated border border-gold-border/20 rounded-sm space-y-2">
                    <h4 className="font-serif text-sm font-semibold text-heading">
                      {evt.title}
                    </h4>
                    {evt.description && (
                      <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                    <div className="text-[11px] text-text-muted pt-2 border-t border-gold-border/15 flex items-center justify-between">
                      <span>📍 {evt.location || 'โรงเรียนสาธิต มพ.'}</span>
                      <button
                        onClick={() => handleExportICS(evt)}
                        className="text-accent hover:text-gold-text underline"
                      >
                        + ปฏิทิน (.ics)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-text-muted space-y-1">
                <p>ไม่มีกิจกรรมในวันนี้</p>
                <p className="text-[11px] opacity-75">คลิกวันที่ที่มีจุดสีทองบนปฏิทินเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Agenda List View (Ongoing & upcoming chronologically) */}
      <div className="lg:hidden space-y-6 pt-4 border-t border-gold-border/20">
        <h3 className="font-serif text-xl font-semibold text-heading">
          กิจกรรมที่กำลังจัดและกำลังจะมาถึง
        </h3>

        {activeOrUpcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {activeOrUpcomingEvents.map((evt) => {
              const p = getThaiDateParts(evt.startAt);
              const hasEnd = Boolean(evt.endAt && getEventDateKey(evt.endAt) > getEventDateKey(evt.startAt));
              return (
                <div key={evt.id} className="p-4 bg-surface-elevated border border-gold-border/20 rounded-sm flex gap-4">
                  <div className="w-14 h-14 bg-brand-soft rounded-sm flex flex-col items-center justify-center shrink-0 border border-gold-border/30">
                    <span className="font-serif text-xl font-bold text-accent leading-none">{p.day}</span>
                    <span className="text-[10px] text-gold-text font-medium">{p.monthShort}</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif text-sm font-semibold text-heading">{evt.title}</h4>
                    {hasEnd && evt.endAt && (
                      <p className="text-[11px] text-gold-text font-medium">
                        ช่วงวันที่จัด: {formatThaiDate(evt.startAt, true)} – {formatThaiDate(evt.endAt, true)}
                      </p>
                    )}
                    <p className="text-xs text-text-muted line-clamp-2">{evt.description}</p>
                    <div className="text-[11px] text-text-muted pt-1 flex items-center justify-between">
                      <span>📍 {evt.location || 'โรงเรียนสาธิต มพ.'}</span>
                      <button
                        onClick={() => handleExportICS(evt)}
                        className="text-accent underline text-[11px]"
                      >
                        + บันทึกลงปฏิทิน
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-6 text-center">ยังไม่มีกิจกรรมที่กำลังจัดหรือกำลังจะมาถึง</p>
        )}
      </div>
    </div>
  );
};
