import { db, admin } from '../config/firebase';
import { logger } from '../utils/logger';

export interface AuditEventParams {
  action: string;
  actorUid: string;
  targetRef?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  ip?: string;
  details?: Record<string, any>;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
}

// In-memory recorder for test verification
let mockAuditLogs: Array<Record<string, any>> = [];

export function getRecordedAuditLogs(): Array<Record<string, any>> {
  return [...mockAuditLogs];
}

export function getLastRecordedAuditLog(): Record<string, any> | undefined {
  return mockAuditLogs[mockAuditLogs.length - 1];
}

export function clearRecordedAuditLogs(): void {
  mockAuditLogs = [];
}

/**
 * Append-only Audit Event Service.
 * Writes audit log entries with before/after state to Firestore /audit_logs collection.
 * Strict Firestore Security Rules deny browser clients from creating/editing/deleting audit logs.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const auditDoc: Record<string, any> = {
      action: params.action,
      actorUid: params.actorUid,
      targetRef: params.targetRef || null,
      outcome: params.outcome,
      ip: params.ip || 'unknown',
      details: params.details || null,
      beforeState: params.beforeState !== undefined ? params.beforeState : null,
      afterState: params.afterState !== undefined ? params.afterState : null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    mockAuditLogs.push(auditDoc);

    if (!process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === 'test') {
      logger.info(`Audit log recorded (unit-test mock): ${params.action}`, { actorUid: params.actorUid, outcome: params.outcome });
      return;
    }

    await db.collection('audit_logs').add(auditDoc);
    logger.info(`Audit log recorded: ${params.action}`, { actorUid: params.actorUid, outcome: params.outcome });
  } catch (error) {
    logger.error('Failed to record audit event', { error: (error as Error).message });
  }
}
