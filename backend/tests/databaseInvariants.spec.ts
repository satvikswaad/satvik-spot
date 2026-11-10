import * as fs from 'fs';
import * as path from 'path';
import {
  formatDailyDateKey,
  createInitialDailyStatsRecord,
  applySaleToDailyStats,
  applyRefundToDailyStats
} from '../src/db/statsDailyService';

describe('Wave 2 — Database Architecture & Rules (DB-1..7, Section 11.4)', () => {
  describe('1. Universal Deny-All Security Rules (DB-1)', () => {
    it('DB-1: firestore.rules enforces unconditional match /{document=**} { allow read, write: if false; }', () => {
      const rulesPath = path.resolve(__dirname, '../../firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      expect(content).toMatch(/rules_version\s*=\s*'2';/);
      expect(content).toMatch(/service\s+cloud\.firestore/);
      expect(content).toMatch(/match\s*\/databases\/\{database\}\/documents/);
      expect(content).toMatch(/match\s*\/\{document=\*\*\s*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/);
    });
  });

  describe('2. Authoritative Indexes (Section 11.4)', () => {
    it('firestore.indexes.json contains all required composite indexes', () => {
      const indexesPath = path.resolve(__dirname, '../../firestore.indexes.json');
      const indexesJson = JSON.parse(fs.readFileSync(indexesPath, 'utf-8'));
      const indexes: any[] = indexesJson.indexes || [];

      // Check orders (userId, createdAt)
      const ordersUser = indexes.find(
        (idx) =>
          idx.collectionGroup === 'orders' &&
          idx.fields?.[0]?.fieldPath === 'userId' &&
          idx.fields?.[1]?.fieldPath === 'createdAt'
      );
      expect(ordersUser).toBeDefined();

      // Check orders (orderStatus, createdAt)
      const ordersStatus = indexes.find(
        (idx) =>
          idx.collectionGroup === 'orders' &&
          idx.fields?.[0]?.fieldPath === 'orderStatus' &&
          idx.fields?.[1]?.fieldPath === 'createdAt'
      );
      expect(ordersStatus).toBeDefined();

      // Check reservations (status, expiresAt)
      const reservations = indexes.find(
        (idx) =>
          idx.collectionGroup === 'reservations' &&
          idx.fields?.[0]?.fieldPath === 'status' &&
          idx.fields?.[1]?.fieldPath === 'expiresAt'
      );
      expect(reservations).toBeDefined();

      // Check reviews (productId, status, createdAt)
      const reviews = indexes.find(
        (idx) =>
          idx.collectionGroup === 'reviews' &&
          idx.fields?.[0]?.fieldPath === 'productId' &&
          idx.fields?.[1]?.fieldPath === 'status' &&
          idx.fields?.[2]?.fieldPath === 'createdAt'
      );
      expect(reviews).toBeDefined();
    });
  });

  describe('3. stats_daily Aggregations (DB-5, DB-6, DB-7)', () => {
    it('formatDailyDateKey creates standard YYYY-MM-DD key in IST', () => {
      const d = new Date('2026-11-10T04:30:00.000Z'); // 10:00 IST
      expect(formatDailyDateKey(d)).toBe('2026-11-10');
    });

    it('applySaleToDailyStats increments revenuePaise, ordersCount, and channel totals', () => {
      const initial = createInitialDailyStatsRecord('2026-11-10');
      const updated = applySaleToDailyStats(initial, {
        totalPaise: 49900,
        channel: 'ONLINE',
        hour: 10,
        unitsCount: 2
      });

      expect(updated.revenuePaise).toBe(49900);
      expect(updated.ordersCount).toBe(1);
      expect(updated.unitsCount).toBe(2);
      expect(updated.byChannel.ONLINE.revenuePaise).toBe(49900);
      expect(updated.byChannel.ONLINE.ordersCount).toBe(1);
      expect(updated.byHour['10'].revenuePaise).toBe(49900);
    });

    it('applyRefundToDailyStats decrements revenuePaise accurately (DB-7)', () => {
      const base = createInitialDailyStatsRecord('2026-11-10');
      base.revenuePaise = 100000;
      base.ordersCount = 2;

      const afterRefund = applyRefundToDailyStats(base, 25000);
      expect(afterRefund.revenuePaise).toBe(75000);
      expect(afterRefund.refundedPaise).toBe(25000);
    });
  });
});
