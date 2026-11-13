/**
 * Satvik Swaad — Tamper-Evident Append-Only Cryptographic Audit Log
 * Authority: docs/SPEC.md Section 13.1 (LOG-2, LOG-3), Section 15.2 (INV-6)
 *
 * Rules:
 * - LOG-2: audit_logs is append-only. Each entry stores prevHash and
 *   hash = SHA256(prevHash + canonical entry), written in a transaction
 *   that updates head pointer in audit_head/current.
 * - INV-6: Hash chain verifies from first entry to latest with zero broken links.
 */

import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { logger } from '../utils/logger';

export const GENESIS_HASH = '0'.repeat(64);

export interface AuditEventParams {
  action: string;
  actorUid: string;
  targetRef?: string | null;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  ip?: string;
  details?: Record<string, any> | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
}

export interface StoredAuditLogEntry extends AuditEventParams {
  sequence: number;
  prevHash: string;
  hash: string;
  timestamp: string;
}

// In-memory recorder for test verification
let mockAuditLogs: Array<StoredAuditLogEntry> = [];

export function getRecordedAuditLogs(): Array<StoredAuditLogEntry> {
  return [...mockAuditLogs];
}

export function getLastRecordedAuditLog(): StoredAuditLogEntry | undefined {
  return mockAuditLogs[mockAuditLogs.length - 1];
}

export function clearRecordedAuditLogs(): void {
  mockAuditLogs = [];
}

/**
 * Computes deterministic SHA-256 canonical hash of the audit entry combined with prevHash (LOG-2).
 */
export function computeAuditEntryHash(prevHash: string, entry: {
  sequence: number;
  action: string;
  actorUid: string;
  targetRef: string | null;
  outcome: string;
  timestamp: string;
  details?: Record<string, any> | null;
}): string {
  const canonicalString = JSON.stringify({
    sequence: entry.sequence,
    action: entry.action,
    actorUid: entry.actorUid,
    targetRef: entry.targetRef || null,
    outcome: entry.outcome,
    timestamp: entry.timestamp,
    details: entry.details || null
  });

  return crypto.createHash('sha256').update(prevHash + canonicalString).digest('hex');
}

/**
 * Append-only Audit Event Service with Cryptographic Hash Chain (LOG-2).
 * Writes entry to Firestore audit_logs collection and updates audit_head/current inside transaction.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<StoredAuditLogEntry> {
  const timestampIso = new Date().toISOString();

  // If in pure test mock mode without Firestore emulator/connection
  if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
    const lastEntry = mockAuditLogs[mockAuditLogs.length - 1];
    const sequence = lastEntry ? lastEntry.sequence + 1 : 1;
    const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;

    const hash = computeAuditEntryHash(prevHash, {
      sequence,
      action: params.action,
      actorUid: params.actorUid,
      targetRef: params.targetRef || null,
      outcome: params.outcome,
      timestamp: timestampIso,
      details: params.details || null
    });

    const mockDoc: StoredAuditLogEntry = {
      ...params,
      sequence,
      prevHash,
      hash,
      timestamp: timestampIso
    };

    mockAuditLogs.push(mockDoc);
    logger.info(`Audit log recorded (unit test chain): ${params.action} [seq ${sequence}]`, {
      action: params.action,
      actorUid: params.actorUid,
      hash
    });

    return mockDoc;
  }

  // Transactional hash-chained write to Firestore (LOG-2)
  return db.runTransaction(async (transaction) => {
    const headRef = db.collection('audit_head').doc('current');
    const headSnap = await transaction.get(headRef);

    let sequence = 1;
    let prevHash = GENESIS_HASH;

    if (headSnap.exists) {
      const headData = headSnap.data()!;
      sequence = (headData.sequence || 0) + 1;
      prevHash = headData.hash || GENESIS_HASH;
    }

    const hash = computeAuditEntryHash(prevHash, {
      sequence,
      action: params.action,
      actorUid: params.actorUid,
      targetRef: params.targetRef || null,
      outcome: params.outcome,
      timestamp: timestampIso,
      details: params.details || null
    });

    const auditEntry: StoredAuditLogEntry = {
      action: params.action,
      actorUid: params.actorUid,
      targetRef: params.targetRef || null,
      outcome: params.outcome,
      ip: params.ip || 'unknown',
      details: params.details || null,
      beforeState: params.beforeState !== undefined ? params.beforeState : null,
      afterState: params.afterState !== undefined ? params.afterState : null,
      sequence,
      prevHash,
      hash,
      timestamp: timestampIso
    };

    // 1. Append entry to audit_logs
    const newEntryRef = db.collection('audit_logs').doc();
    transaction.set(newEntryRef, {
      ...auditEntry,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Update audit_head/current
    transaction.set(headRef, {
      sequence,
      hash,
      lastAction: params.action,
      lastActorUid: params.actorUid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    mockAuditLogs.push(auditEntry);
    logger.info(`Audit log recorded with hash chain: ${params.action} [seq ${sequence}]`, {
      hash,
      prevHash
    });

    return auditEntry;
  });
}

/**
 * Validates the complete cryptographic hash chain of audit logs from genesis to head (INV-6).
 */
export async function verifyAuditHashChain(): Promise<{
  valid: boolean;
  entriesVerified: number;
  brokenSequence?: number;
  expectedHash?: string;
  actualHash?: string;
}> {
  // If in test environment without emulator, verify mock chain
  if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
    let currentPrev = GENESIS_HASH;
    for (const entry of mockAuditLogs) {
      if (entry.prevHash !== currentPrev) {
        return {
          valid: false,
          entriesVerified: entry.sequence - 1,
          brokenSequence: entry.sequence,
          expectedHash: currentPrev,
          actualHash: entry.prevHash
        };
      }
      const calculatedHash = computeAuditEntryHash(entry.prevHash, {
        sequence: entry.sequence,
        action: entry.action,
        actorUid: entry.actorUid,
        targetRef: entry.targetRef || null,
        outcome: entry.outcome,
        timestamp: entry.timestamp,
        details: entry.details || null
      });

      if (calculatedHash !== entry.hash) {
        return {
          valid: false,
          entriesVerified: entry.sequence - 1,
          brokenSequence: entry.sequence,
          expectedHash: calculatedHash,
          actualHash: entry.hash
        };
      }
      currentPrev = entry.hash;
    }
    return { valid: true, entriesVerified: mockAuditLogs.length };
  }

  // Query Firestore audit_logs in sequence
  const logsSnap = await db.collection('audit_logs').orderBy('sequence', 'asc').get();
  let currentPrev = GENESIS_HASH;

  for (const doc of logsSnap.docs) {
    const entry = doc.data() as StoredAuditLogEntry;
    if (entry.prevHash !== currentPrev) {
      return {
        valid: false,
        entriesVerified: entry.sequence - 1,
        brokenSequence: entry.sequence,
        expectedHash: currentPrev,
        actualHash: entry.prevHash
      };
    }

    const calculatedHash = computeAuditEntryHash(entry.prevHash, {
      sequence: entry.sequence,
      action: entry.action,
      actorUid: entry.actorUid,
      targetRef: entry.targetRef || null,
      outcome: entry.outcome,
      timestamp: entry.timestamp,
      details: entry.details || null
    });

    if (calculatedHash !== entry.hash) {
      return {
        valid: false,
        entriesVerified: entry.sequence - 1,
        brokenSequence: entry.sequence,
        expectedHash: calculatedHash,
        actualHash: entry.hash
      };
    }

    currentPrev = entry.hash;
  }

  return { valid: true, entriesVerified: logsSnap.size };
}
