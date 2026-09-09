import { db, admin } from '../config/firebase';
import { logger } from '../utils/logger';

export interface InventoryLogParams {
  productId: string;
  variantId?: string;
  previousStock: number;
  newStock: number;
  delta: number;
  reason: 'ORDER_DEDUCTION' | 'ADMIN_ADJUSTMENT' | 'REFUND_RESTORE' | 'INITIAL_SEED' | string;
  orderId?: string;
  actorUid?: string;
}

/**
 * Appends an inventory audit log within an active Firestore transaction.
 * Ensures stock changes are strictly auditable and non-repudiable.
 */
export function logInventoryChangeInTransaction(
  transaction: admin.firestore.Transaction,
  params: InventoryLogParams
): admin.firestore.DocumentReference {
  const logRef = db.collection('inventory_logs').doc();

  transaction.set(logRef, {
    productId: params.productId,
    ...(params.variantId ? { variantId: params.variantId } : {}),
    previousStock: params.previousStock,
    newStock: params.newStock,
    delta: params.delta,
    reason: params.reason,
    ...(params.orderId ? { orderId: params.orderId } : {}),
    ...(params.actorUid ? { actorUid: params.actorUid } : {}),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  logger.info('Inventory log recorded in transaction', {
    productId: params.productId,
    variantId: params.variantId,
    delta: params.delta,
    reason: params.reason,
    orderId: params.orderId
  });

  return logRef;
}

/**
 * Standalone helper to record an inventory change outside of an explicit transaction.
 */
export async function logInventoryChange(params: InventoryLogParams): Promise<string> {
  const logRef = db.collection('inventory_logs').doc();

  await logRef.set({
    productId: params.productId,
    ...(params.variantId ? { variantId: params.variantId } : {}),
    previousStock: params.previousStock,
    newStock: params.newStock,
    delta: params.delta,
    reason: params.reason,
    ...(params.orderId ? { orderId: params.orderId } : {}),
    ...(params.actorUid ? { actorUid: params.actorUid } : {}),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return logRef.id;
}
