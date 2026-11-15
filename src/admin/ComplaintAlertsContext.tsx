/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ComplaintItem, ComplaintStatus, ComplaintType } from '../types';
import { playAlert } from '../lib/alertSound';
import { useAdminAuth } from './AdminAuthContext';

export const PENDING_COMPLAINT_STATUSES: ComplaintStatus[] = [
  'received',
  'considering',
  'in_progress',
];

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  complaint: 'เรื่องร้องเรียน',
  corruption: 'เบาะแสทุจริต',
  inquiry: 'สอบถาม',
  suggestion: 'ข้อเสนอแนะ',
  compliment: 'ชมเชย',
  other: 'อื่น ๆ',
};

export function getComplaintTypeLabel(type?: string): string {
  if (!type) return 'อื่น ๆ';
  return COMPLAINT_TYPE_LABELS[type as ComplaintType] || 'อื่น ๆ';
}

export interface PendingStatusCounts {
  received: number;
  considering: number;
  in_progress: number;
  total: number;
}

export interface LiveComplaintToast {
  id: string;
  items: ComplaintItem[];
  isUrgent: boolean;
  createdAtMs: number;
}

interface ComplaintAlertsContextValue {
  pendingComplaints: ComplaintItem[];
  pendingCount: number;
  countsByStatus: PendingStatusCounts;
  loading: boolean;
  pulseTick: number;
  indexError: string | null;
  firstLoginModalOpen: boolean;
  dismissFirstLoginModal: () => void;
  liveToast: LiveComplaintToast | null;
  dismissLiveToast: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const ComplaintAlertsContext = createContext<ComplaintAlertsContextValue | undefined>(undefined);

const EMPTY_COUNTS: PendingStatusCounts = {
  received: 0,
  considering: 0,
  in_progress: 0,
  total: 0,
};

function computeCounts(items: ComplaintItem[]): PendingStatusCounts {
  let received = 0;
  let considering = 0;
  let in_progress = 0;
  for (const item of items) {
    if (item.status === 'received') received++;
    else if (item.status === 'considering') considering++;
    else if (item.status === 'in_progress') in_progress++;
  }
  return {
    received,
    considering,
    in_progress,
    total: items.length,
  };
}

export const ComplaintAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthorized, isEditor } = useAdminAuth();

  const [pendingComplaints, setPendingComplaints] = useState<ComplaintItem[]>([]);
  const [countsByStatus, setCountsByStatus] = useState<PendingStatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [pulseTick, setPulseTick] = useState(0);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [firstLoginModalOpen, setFirstLoginModalOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<LiveComplaintToast | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('admin.sound') !== 'off'
  );

  const initialSnapshotDoneRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const dismissLiveToast = useCallback(() => {
    clearToastTimer();
    setLiveToast(null);
  }, [clearToastTimer]);

  const dismissFirstLoginModal = useCallback(() => {
    setFirstLoginModalOpen(false);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('admin.sound', next ? 'on' : 'off');
      window.dispatchEvent(new CustomEvent('admin-sound-changed', { detail: next }));
      return next;
    });
  }, []);

  // Sync sound preference across components/tabs
  useEffect(() => {
    const onCustom = (ev: Event) => {
      const customEv = ev as CustomEvent<boolean>;
      setSoundEnabled(Boolean(customEv.detail));
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'admin.sound') {
        setSoundEnabled(ev.newValue !== 'off');
      }
    };
    window.addEventListener('admin-sound-changed', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('admin-sound-changed', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Update document.title while inside AdminLayout
  useEffect(() => {
    const previousTitle = document.title;
    const baseTitle = 'ผู้ดูแลระบบ | องค์การนักเรียน';
    const total = countsByStatus.total;
    document.title = total > 0 ? `(${total}) ${baseTitle}` : baseTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [countsByStatus.total]);

  // Real-time Firestore listener for pending complaints
  useEffect(() => {
    if (!user || !isAuthorized || !isEditor) {
      setPendingComplaints([]);
      setCountsByStatus(EMPTY_COUNTS);
      setLoading(false);
      setFirstLoginModalOpen(false);
      dismissLiveToast();
      initialSnapshotDoneRef.current = false;
      return;
    }

    initialSnapshotDoneRef.current = false;
    setLoading(true);
    setIndexError(null);

    const pendingQuery = query(
      collection(db, 'complaints'),
      where('status', 'in', PENDING_COMPLAINT_STATUSES)
    );

    const unsubscribe = onSnapshot(
      pendingQuery,
      (snapshot) => {
        const items: ComplaintItem[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as ComplaintItem);
        });

        // Client-side descending sort by createdAt (avoids requiring composite Firestore index)
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        setPendingComplaints(items);
        const nextCounts = computeCounts(items);
        setCountsByStatus(nextCounts);
        setLoading(false);

        if (!initialSnapshotDoneRef.current) {
          initialSnapshotDoneRef.current = true;

          const sessionKey = `admin.alerts.firstPopup.${user.uid}`;
          const alreadyShown = sessionStorage.getItem(sessionKey) === '1';
          if (!alreadyShown && items.length > 0) {
            sessionStorage.setItem(sessionKey, '1');
            setFirstLoginModalOpen(true);
            void playAlert({ urgent: false });
          }
          return;
        }

        // Subsequent snapshots: detect newly added pending complaints while online
        const addedItems: ComplaintItem[] = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            addedItems.push({ id: change.doc.id, ...change.doc.data() } as ComplaintItem);
          }
        });

        if (addedItems.length > 0) {
          addedItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          const isUrgent = addedItems.some((item) => item.type === 'corruption');
          setPulseTick((t) => t + 1);
          void playAlert({ urgent: isUrgent });

          clearToastTimer();
          setLiveToast({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            items: addedItems,
            isUrgent,
            createdAtMs: Date.now(),
          });

          toastTimerRef.current = window.setTimeout(() => {
            setLiveToast(null);
            toastTimerRef.current = null;
          }, 8000);
        }
      },
      (error) => {
        console.error('ComplaintAlerts onSnapshot error:', error);
        setLoading(false);
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.toLowerCase().includes('index')) {
          setIndexError(msg);
        }
      }
    );

    return () => {
      unsubscribe();
      clearToastTimer();
    };
  }, [user, isAuthorized, isEditor, clearToastTimer, dismissLiveToast]);

  return (
    <ComplaintAlertsContext.Provider
      value={{
        pendingComplaints,
        pendingCount: countsByStatus.total,
        countsByStatus,
        loading,
        pulseTick,
        indexError,
        firstLoginModalOpen,
        dismissFirstLoginModal,
        liveToast,
        dismissLiveToast,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </ComplaintAlertsContext.Provider>
  );
};

export function usePendingComplaints(): ComplaintAlertsContextValue {
  const ctx = useContext(ComplaintAlertsContext);
  if (!ctx) {
    throw new Error('usePendingComplaints must be used within ComplaintAlertsProvider');
  }
  return ctx;
}
