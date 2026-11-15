/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRinging, X } from '@phosphor-icons/react';
import {
  getComplaintTypeLabel,
  usePendingComplaints,
} from '../../admin/ComplaintAlertsContext';

export const NewComplaintToast: React.FC = () => {
  const navigate = useNavigate();
  const { liveToast, dismissLiveToast } = usePendingComplaints();

  if (!liveToast || liveToast.items.length === 0) {
    return null;
  }

  const count = liveToast.items.length;
  const firstItem = liveToast.items[0];
  const message =
    count === 1
      ? `มีเรื่องใหม่: ${getComplaintTypeLabel(firstItem.type)} – ${firstItem.title}`
      : `มี ${count} เรื่องใหม่`;

  const handleOpen = () => {
    const targetId = count === 1 ? firstItem.id || firstItem.trackingCode : undefined;
    dismissLiveToast();
    if (targetId) {
      navigate(`/admin/complaints?open=${encodeURIComponent(targetId)}`);
    } else {
      navigate('/admin/complaints');
    }
  };

  return (
    <div
      role="status"
      aria-live={liveToast.isUrgent ? 'assertive' : 'polite'}
      className={`fixed top-4 right-4 z-[80] w-[calc(100vw-2rem)] max-w-sm bg-[#2B1150] text-[#FAF7F0] border border-[#B8923A] rounded-sm shadow-2xl p-3.5 sm:p-4 transition-all ${
        liveToast.isUrgent ? 'border-l-4 border-l-[#E5383B]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            liveToast.isUrgent
              ? 'bg-[#E5383B]/20 text-[#FF7B7D]'
              : 'bg-[#B8923A]/20 text-[#D9B867]'
          }`}
        >
          <BellRinging size={18} weight="light" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-[13px] font-medium leading-snug text-[#FAF7F0] break-words">
              {message}
            </p>
            <button
              type="button"
              onClick={dismissLiveToast}
              aria-label="ปิดการแจ้งเตือน"
              className="text-[#FAF7F0]/60 hover:text-[#FAF7F0] p-0.5 shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            {liveToast.isUrgent ? (
              <span className="text-[10px] font-semibold text-[#FF8A8C] uppercase tracking-wider">
                แจ้งเตือนเร่งด่วน · เบาะแสทุจริต
              </span>
            ) : (
              <span className="text-[10px] text-[#D9B867]/90">
                แจ้งเตือนแบบเรียลไทม์
              </span>
            )}
            <button
              type="button"
              onClick={handleOpen}
              className="px-3 py-1 bg-[#B8923A] hover:bg-[#D9B867] text-[#1B1226] text-[11px] font-semibold rounded-sm transition-colors shrink-0"
            >
              เปิดดู
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
