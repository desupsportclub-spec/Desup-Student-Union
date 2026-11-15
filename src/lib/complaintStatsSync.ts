/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ComplaintItem, ComplaintStatsSummary } from '../types';

export function computeComplaintStats(items: Pick<ComplaintItem, 'status'>[]): ComplaintStatsSummary {
  let resolved = 0;
  let inProgress = 0;

  for (const item of items) {
    if (item.status === 'resolved') {
      resolved++;
    } else {
      inProgress++;
    }
  }

  return {
    total: items.length,
    inProgress,
    resolved,
  };
}

/**
 * Admin-only: reconcile public summary counts on settings/site
 * so visitors on the homepage see accurate counts without listing complaints.
 */
export async function syncComplaintStatsToSettings(stats: ComplaintStatsSummary): Promise<void> {
  try {
    await setDoc(
      doc(db, 'settings', 'site'),
      {
        complaintStats: {
          total: stats.total,
          inProgress: stats.inProgress,
          resolved: stats.resolved,
        },
      },
      { merge: true }
    );
  } catch {
    // Non-fatal if caller does not have admin permission
  }
}

/**
 * Public visitor submission: safely increment complaintStats on settings/site
 * in accordance with strict Firestore security rules.
 */
export async function incrementPublicComplaintStats(): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'site');
    const snap = await getDoc(settingsRef);
    if (!snap.exists()) return;

    const existingStats = snap.data()?.complaintStats;
    const hasValidMap =
      existingStats &&
      typeof existingStats === 'object' &&
      typeof existingStats.total === 'number' &&
      typeof existingStats.inProgress === 'number' &&
      typeof existingStats.resolved === 'number';

    if (hasValidMap) {
      await updateDoc(settingsRef, {
        'complaintStats.total': increment(1),
        'complaintStats.inProgress': increment(1),
      });
    } else {
      await updateDoc(settingsRef, {
        complaintStats: {
          total: 1,
          inProgress: 1,
          resolved: 0,
        },
      });
    }
  } catch {
    // Non-fatal: admin view will reconcile stats on next open
  }
}
