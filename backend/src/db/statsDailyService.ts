/**
 * Satvik Swaad — Authoritative stats_daily Analytics Aggregation Service
 * Authority: docs/SPEC.md Section 11.3 (DB-5, DB-6, DB-7)
 *
 * Rules:
 * - DB-5: Free Firestore tier reads ~50k/day. Each sale increments stats_daily/{date}
 *   inside the transaction so the dashboard reads only summary docs.
 * - DB-6: Sum of daily docs for weekly/monthly; rush-hour reads byHour map.
 * - DB-7: Refunds subtract from the same counters in transaction.
 */

import { Channel } from '../shared';
import { db, admin } from '../config/firebase';
import { Transaction } from 'firebase-admin/firestore';

export interface DailyStatsByChannel {
  revenuePaise: number;
  ordersCount: number;
}

export interface DailyStatsRecord {
  date: string; // YYYY-MM-DD
  revenuePaise: number;
  ordersCount: number;
  unitsCount: number;
  refundedPaise: number;
  byChannel: Record<string, DailyStatsByChannel>;
  byHour: Record<string, { revenuePaise: number; ordersCount: number }>;
  updatedAt?: any;
}

/**
 * Formats a Date object into YYYY-MM-DD using Indian Standard Time (IST, UTC+5:30).
 */
export function formatDailyDateKey(date = new Date()): string {
  // Convert UTC date to IST (+5.5 hours)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initializes a zeroed daily summary record for a new day.
 */
export function createInitialDailyStatsRecord(date: string): DailyStatsRecord {
  const byHour: Record<string, { revenuePaise: number; ordersCount: number }> = {};
  for (let h = 0; h < 24; h++) {
    byHour[String(h)] = { revenuePaise: 0, ordersCount: 0 };
  }

  const byChannel: Record<string, DailyStatsByChannel> = {
    ONLINE: { revenuePaise: 0, ordersCount: 0 },
    OFFLINE_COUNTER: { revenuePaise: 0, ordersCount: 0 },
    OFFLINE_PHONE: { revenuePaise: 0, ordersCount: 0 },
    OFFLINE_EVENT: { revenuePaise: 0, ordersCount: 0 },
    WHATSAPP: { revenuePaise: 0, ordersCount: 0 }
  };

  return {
    date,
    revenuePaise: 0,
    ordersCount: 0,
    unitsCount: 0,
    refundedPaise: 0,
    byChannel,
    byHour
  };
}

/**
 * Pure function that calculates updated stats_daily when a sale completes. (DB-5)
 */
export function applySaleToDailyStats(
  current: DailyStatsRecord,
  sale: {
    totalPaise: number;
    channel: Channel;
    hour: number;
    unitsCount: number;
  }
): DailyStatsRecord {
  const updated: DailyStatsRecord = JSON.parse(JSON.stringify(current));

  updated.revenuePaise += sale.totalPaise;
  updated.ordersCount += 1;
  updated.unitsCount += sale.unitsCount;

  // By Channel
  if (!updated.byChannel[sale.channel]) {
    updated.byChannel[sale.channel] = { revenuePaise: 0, ordersCount: 0 };
  }
  updated.byChannel[sale.channel].revenuePaise += sale.totalPaise;
  updated.byChannel[sale.channel].ordersCount += 1;

  // By Hour
  const hKey = String(sale.hour);
  if (!updated.byHour[hKey]) {
    updated.byHour[hKey] = { revenuePaise: 0, ordersCount: 0 };
  }
  updated.byHour[hKey].revenuePaise += sale.totalPaise;
  updated.byHour[hKey].ordersCount += 1;

  return updated;
}

/**
 * Pure function that calculates updated stats_daily when a refund is processed. (DB-7)
 */
export function applyRefundToDailyStats(
  current: DailyStatsRecord,
  refundPaise: number
): DailyStatsRecord {
  const updated: DailyStatsRecord = JSON.parse(JSON.stringify(current));
  updated.revenuePaise = Math.max(0, updated.revenuePaise - refundPaise);
  updated.refundedPaise = (updated.refundedPaise || 0) + refundPaise;
  return updated;
}

/**
 * Updates stats_daily atomically in a Firestore transaction when a sale is placed/settled. (INV-5, DB-5)
 */
export async function recordSaleInDailyStatsInTransaction(
  transaction: Transaction,
  sale: {
    totalPaise: number;
    channel: Channel;
    unitsCount: number;
    timestamp?: Date;
  }
): Promise<void> {
  const dateObj = sale.timestamp || new Date();
  const dateKey = formatDailyDateKey(dateObj);
  // IST hour (UTC + 5.5 hours)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(dateObj.getTime() + istOffsetMs);
  const hour = istDate.getUTCHours();

  const statsDocRef = db.collection('stats_daily').doc(dateKey);
  const snap = await transaction.get(statsDocRef);

  let currentStats: DailyStatsRecord;
  if (!snap.exists) {
    currentStats = createInitialDailyStatsRecord(dateKey);
  } else {
    currentStats = snap.data() as DailyStatsRecord;
  }

  const updatedStats = applySaleToDailyStats(currentStats, {
    totalPaise: sale.totalPaise,
    channel: sale.channel,
    hour,
    unitsCount: sale.unitsCount
  });

  transaction.set(statsDocRef, {
    ...updatedStats,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Updates stats_daily atomically in a Firestore transaction when a refund is processed. (INV-5, DB-7)
 */
export async function recordRefundInDailyStatsInTransaction(
  transaction: Transaction,
  refundPaise: number,
  dateKey?: string
): Promise<void> {
  const targetKey = dateKey || formatDailyDateKey();
  const statsDocRef = db.collection('stats_daily').doc(targetKey);
  const snap = await transaction.get(statsDocRef);

  if (snap.exists) {
    const currentStats = snap.data() as DailyStatsRecord;
    const updatedStats = applyRefundToDailyStats(currentStats, refundPaise);
    transaction.update(statsDocRef, {
      revenuePaise: updatedStats.revenuePaise,
      refundedPaise: updatedStats.refundedPaise,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}
