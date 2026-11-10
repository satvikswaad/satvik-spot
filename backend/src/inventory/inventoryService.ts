/**
 * Satvik Swaad — Authoritative Inventory & Reservation Engine
 * Authority: docs/SPEC.md Section 8 (STOCK-1 to STOCK-7)
 *
 * Rules:
 * - STOCK-1: Stock never goes negative. Guard inside transaction: onHand - reserved >= qty.
 * - STOCK-2: All stock adjustments happen through this module only.
 * - STOCK-3: Variants <= lowStockUnits (5 units) trigger owner alert.
 * - STOCK-4: Reservation hold durations by channel (15m online, 120m UPI/WA, 30m COD).
 * - STOCK-6: Append-only ledger in stockMovements on every stock change.
 */

import { db, admin } from '../config/firebase';
import { logger } from '../utils/logger';
import { CONFIG_LIMITS, Channel, PaymentMethod } from '../shared';

export class InsufficientStockError extends Error {
  public readonly statusCode = 409;
  constructor(variantId: string, requested: number, available: number) {
    super(`[STOCK-1] Insufficient inventory for variant '${variantId}': requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

export interface ReservationLine {
  variantId: string;
  qty: number;
}

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
 * Calculates reservation duration in minutes based on channel and paymentMethod. (Section 8.4)
 */
export function getReservationDurationMinutes(channel: Channel, paymentMethod?: PaymentMethod): number {
  if (channel === 'WHATSAPP' || paymentMethod === 'UPI_MANUAL') {
    return CONFIG_LIMITS.reserveSlowMinutes; // 120 minutes (2 hours)
  }
  if (paymentMethod === 'COD') {
    return CONFIG_LIMITS.reserveCodMinutes; // 30 minutes
  }
  return CONFIG_LIMITS.reserveOnlineMinutes; // 15 minutes (default online PayU/Razorpay)
}

/**
 * Reserves inventory inside an active Firestore transaction. (STOCK-1, STOCK-4)
 * Enforces atomic compare-and-set: (onHand - reserved) >= requestedQty.
 */
export async function reserveStockInTransaction(
  transaction: admin.firestore.Transaction,
  orderId: string,
  lines: ReservationLine[],
  channel: Channel = 'ONLINE',
  paymentMethod?: PaymentMethod
): Promise<void> {
  const durationMinutes = getReservationDurationMinutes(channel, paymentMethod);
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  // 1. Read all inventory documents
  const inventoryRefs = lines.map((line) => db.collection('inventory').doc(line.variantId));
  const inventoryDocs = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));

  // 2. Validate availability (STOCK-1: onHand - reserved >= qty)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const doc = inventoryDocs[i];

    const data = doc.exists ? doc.data() || {} : { onHand: 0, reserved: 0 };
    const onHand: number = data.onHand || 0;
    const reserved: number = data.reserved || 0;
    const available = onHand - reserved;

    if (available < line.qty) {
      throw new InsufficientStockError(line.variantId, line.qty, available);
    }
  }

  // 3. Atomically update reserved counts & log movements (STOCK-6)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ref = inventoryRefs[i];
    const doc = inventoryDocs[i];
    const data = doc.exists ? doc.data() || {} : { onHand: 0, reserved: 0 };

    const currentReserved = data.reserved || 0;
    const newReserved = currentReserved + line.qty;

    transaction.set(ref, { reserved: newReserved }, { merge: true });

    // Append to stockMovements (STOCK-6)
    const movementRef = db.collection('stockMovements').doc();
    transaction.set(movementRef, {
      variantId: line.variantId,
      delta: line.qty,
      before: currentReserved,
      after: newReserved,
      type: 'RESERVE',
      orderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 4. Record the reservation document
  const reservationRef = db.collection('reservations').doc(orderId);
  transaction.set(reservationRef, {
    orderId,
    lines,
    channel,
    status: 'ACTIVE',
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  logger.info('Stock successfully reserved in transaction', { orderId, durationMinutes });
}

/**
 * Commits sold stock when an order is verified as PAID. (STOCK-1, STOCK-6)
 * Moves reserved count to permanent deduction: onHand -= qty, reserved -= qty.
 */
export async function commitSoldStockInTransaction(
  transaction: admin.firestore.Transaction,
  orderId: string,
  lines: ReservationLine[]
): Promise<void> {
  const inventoryRefs = lines.map((line) => db.collection('inventory').doc(line.variantId));
  const inventoryDocs = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ref = inventoryRefs[i];
    const doc = inventoryDocs[i];

    const data = doc.exists ? doc.data() || {} : { onHand: 0, reserved: 0 };
    const currentOnHand = data.onHand || 0;
    const currentReserved = data.reserved || 0;

    const newOnHand = Math.max(0, currentOnHand - line.qty);
    const newReserved = Math.max(0, currentReserved - line.qty);

    transaction.set(ref, { onHand: newOnHand, reserved: newReserved }, { merge: true });

    // Append to stockMovements (STOCK-6)
    const movementRef = db.collection('stockMovements').doc();
    transaction.set(movementRef, {
      variantId: line.variantId,
      delta: -line.qty,
      before: currentOnHand,
      after: newOnHand,
      type: 'SALE_DEDUCT',
      orderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // STOCK-3: Low stock warning check
    if (newOnHand <= CONFIG_LIMITS.lowStockUnits) {
      logger.warn(`LOW STOCK ALERT: Variant '${line.variantId}' is at ${newOnHand} units (threshold: ${CONFIG_LIMITS.lowStockUnits})`);
    }
  }

  // Mark reservation COMPLETED
  const resRef = db.collection('reservations').doc(orderId);
  transaction.set(resRef, { status: 'COMPLETED' }, { merge: true });
}

/**
 * Releases reservation back to available pool on cancellation or expiry. (STOCK-4)
 */
export async function releaseReservationInTransaction(
  transaction: admin.firestore.Transaction,
  orderId: string,
  lines: ReservationLine[],
  reason: string
): Promise<void> {
  const inventoryRefs = lines.map((line) => db.collection('inventory').doc(line.variantId));
  const inventoryDocs = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ref = inventoryRefs[i];
    const doc = inventoryDocs[i];

    const data = doc.exists ? doc.data() || {} : { onHand: 0, reserved: 0 };
    const currentReserved = data.reserved || 0;
    const newReserved = Math.max(0, currentReserved - line.qty);

    transaction.set(ref, { reserved: newReserved }, { merge: true });

    // Append to stockMovements (STOCK-6)
    const movementRef = db.collection('stockMovements').doc();
    transaction.set(movementRef, {
      variantId: line.variantId,
      delta: -line.qty,
      before: currentReserved,
      after: newReserved,
      type: 'RESERVATION_RELEASE',
      reason,
      orderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Mark reservation RELEASED
  const resRef = db.collection('reservations').doc(orderId);
  transaction.set(resRef, { status: 'RELEASED', releaseReason: reason }, { merge: true });
}

/**
 * Backward-compatible helper for existing legacy tests (Phase C integrity).
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

  return logRef;
}

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
