/**
 * Satvik Swaad — Point of Sale (POS) & Retail Counter Engine
 * Authority: docs/SPEC.md Section 6.4 (POS-1 to POS-8), Section 18.1 (TAX-2, TAX-3)
 *
 * Rules:
 * - POS-1: Only users with custom claim role 'staff', 'admin', or 'owner' may create POS sales.
 * - POS-2: Server prices every line from product database. Client submits only variant IDs and quantities.
 * - POS-3: Staff discount capped at lower of 5% and ₹100 (10000 paise); owner any with reason.
 * - POS-4: Stock falls through same transactional inventory function as online sales.
 * - POS-6, TAX-3: Sequential invoice number per financial year (SS/YY-YY/000123) from server counter.
 * - POS-8: Shift records opening cash float and closing count with discrepancy tracking.
 */

import { Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { ValidationError, AuthorizationError, OutOfStockError, AppError } from '../errors/AppError';
import { getAuthoritativeProductInTransaction } from '../products/productService';
import { logInventoryChangeInTransaction } from '../inventory/inventoryService';
import { recordSaleInDailyStatsInTransaction } from '../db/statsDailyService';
import { logAuditEvent } from '../audit/auditLogger';
import { generateOrderId } from '../shared';
import { logger } from '../utils/logger';

/**
 * Computes current Indian Financial Year string (e.g. "26-27" for FY 2026-2027).
 * Indian FY starts on April 1st.
 */
export function getCurrentFinancialYearString(date = new Date()): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1; // 1-indexed

  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;

  const startStr = String(startYear).slice(-2);
  const endStr = String(endYear).slice(-2);
  return `${startStr}-${endStr}`;
}

/**
 * Issues sequential invoice number from transactional counter (POS-6, TAX-3).
 * Format: SS/YY-YY/000123
 */
export async function getNextInvoiceNumberInTransaction(
  transaction: admin.firestore.Transaction,
  fyString: string
): Promise<string> {
  const counterRef = db.collection('counters').doc(`invoices_${fyString}`);
  const counterSnap = await transaction.get(counterRef);

  let nextSeq = 1;
  if (counterSnap.exists) {
    nextSeq = (counterSnap.data()?.lastSequence || 0) + 1;
  }

  transaction.set(counterRef, {
    lastSequence: nextSeq,
    fy: fyString,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const seqPadded = String(nextSeq).padStart(6, '0');
  return `SS/${fyString}/${seqPadded}`;
}

/**
 * Starts a new cash shift for a staff member (POS-8).
 */
export async function startShiftHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required to start a shift');
    }

    const { openingFloatPaise } = req.body;
    if (typeof openingFloatPaise !== 'number' || openingFloatPaise < 0 || !Number.isInteger(openingFloatPaise)) {
      throw new ValidationError("Valid non-negative integer 'openingFloatPaise' is required");
    }

    // Check if staff already has an open shift
    const existingSnap = await db.collection('shifts')
      .where('staffUid', '==', req.user.uid)
      .where('status', '==', 'OPEN')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      throw new AppError('You already have an active OPEN shift. Please close it first.', 409, 'SHIFT_ALREADY_OPEN');
    }

    const shiftRef = db.collection('shifts').doc();
    const shiftData = {
      shiftId: shiftRef.id,
      staffUid: req.user.uid,
      staffEmail: req.user.email || null,
      openingFloatPaise,
      cashSalesPaise: 0,
      upiSalesPaise: 0,
      salesCount: 0,
      status: 'OPEN',
      openedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await shiftRef.set(shiftData);

    await logAuditEvent({
      action: 'POS_SHIFT_OPENED',
      actorUid: req.user.uid,
      targetRef: `shifts/${shiftRef.id}`,
      outcome: 'SUCCESS',
      ip: req.ip,
      details: { openingFloatPaise }
    });

    res.status(201).json({
      success: true,
      data: { shiftId: shiftRef.id, openingFloatPaise, status: 'OPEN' }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Closes an active cash shift, recording closing count and cash discrepancy (POS-8).
 */
export async function closeShiftHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }

    const { shiftId } = req.params;
    const { closingCashCountPaise, notes } = req.body;

    if (typeof closingCashCountPaise !== 'number' || closingCashCountPaise < 0 || !Number.isInteger(closingCashCountPaise)) {
      throw new ValidationError("Valid non-negative integer 'closingCashCountPaise' is required");
    }

    const shiftRef = db.collection('shifts').doc(shiftId);

    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(shiftRef);
      if (!snap.exists) {
        throw new AppError('Shift not found', 404, 'NOT_FOUND');
      }

      const shift = snap.data()!;
      if (shift.status !== 'OPEN') {
        throw new AppError('Shift is already closed', 400, 'SHIFT_NOT_OPEN');
      }

      // Check shift ownership (or manager override)
      if (shift.staffUid !== req.user!.uid && req.user!.role !== 'owner' && req.user!.role !== 'admin') {
        throw new AuthorizationError('You can only close your own shift');
      }

      const openingFloat = shift.openingFloatPaise || 0;
      const cashSales = shift.cashSalesPaise || 0;
      const expectedCash = openingFloat + cashSales;
      const differencePaise = closingCashCountPaise - expectedCash;

      const closedData = {
        status: 'CLOSED',
        closingCashCountPaise,
        expectedCashPaise: expectedCash,
        differencePaise,
        notes: notes || null,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        closedByUid: req.user!.uid
      };

      transaction.update(shiftRef, closedData);

      return {
        shiftId,
        openingFloatPaise: openingFloat,
        cashSalesPaise: cashSales,
        expectedCashPaise: expectedCash,
        closingCashCountPaise,
        differencePaise,
        discrepancyPaise: differencePaise,
        status: 'CLOSED'
      };
    });

    await logAuditEvent({
      action: 'POS_SHIFT_CLOSED',
      actorUid: req.user.uid,
      targetRef: `shifts/${shiftId}`,
      outcome: 'SUCCESS',
      ip: req.ip,
      details: result
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates an authoritative in-store / event retail counter sale (POS-1 to POS-8).
 */
export async function sellNowHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Authorization check (POS-1: staff, admin, or owner)
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const userRole = req.user.role || (req.user.roles?.includes('owner') ? 'owner' : req.user.roles?.includes('admin') ? 'admin' : req.user.roles?.includes('staff') ? 'staff' : (req.user.isAdmin ? 'admin' : ''));
    if (!['staff', 'admin', 'owner', 'admin_owner'].includes(userRole) && !req.user.isAdmin) {
      throw new AuthorizationError('Only staff, admin, or owner can create POS sales (POS-1)');
    }

    const { shiftId, items, paymentMethod, customerName, customerPhone, discountPaise = 0, discountReason, lateEntry = false } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('At least one item is required for a POS sale');
    }

    const cleanPaymentMethod = (paymentMethod || '').trim().toUpperCase();
    if (!['CASH', 'UPI_COUNTER', 'CARD'].includes(cleanPaymentMethod)) {
      throw new ValidationError("Payment method must be 'CASH', 'UPI_COUNTER', or 'CARD'");
    }

    const result = await db.runTransaction(async (transaction) => {
      // 2. Validate active shift (POS-8)
      if (shiftId) {
        const shiftSnap = await transaction.get(db.collection('shifts').doc(shiftId));
        if (!shiftSnap.exists || shiftSnap.data()?.status !== 'OPEN') {
          throw new ValidationError('Invalid or inactive shiftId provided');
        }
      }

      // 3. Price lines authoritatively and validate stock (POS-2, POS-4, STOCK-1)
      let subtotalPaise = 0;
      let totalTaxPaise = 0;
      let totalUnits = 0;
      const orderLines: any[] = [];
      const stockUpdates: Array<{ docRef: admin.firestore.DocumentReference; productId: string; variantId?: string; prevStock: number; newStock: number; qty: number }> = [];

      for (const itemInput of items) {
        const prod = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);
        if (prod.stock < itemInput.qty) {
          throw new OutOfStockError(`Insufficient stock for '${prod.name}'. Requested: ${itemInput.qty}, Available: ${prod.stock}`);
        }

        const unitPricePaise = prod.pricePaise || Math.round(prod.price * 100);
        const lineTotalPaise = unitPricePaise * itemInput.qty;
        const taxRate = prod.taxRatePercent || 12;
        const lineTaxPaise = Math.round((lineTotalPaise * taxRate) / (100 + taxRate));

        subtotalPaise += lineTotalPaise;
        totalTaxPaise += lineTaxPaise;
        totalUnits += itemInput.qty;

        orderLines.push({
          productId: prod.id,
          variantId: itemInput.variantId || prod.id,
          title: prod.name,
          unitPricePaise,
          qty: itemInput.qty,
          lineTotalPaise,
          taxPaise: lineTaxPaise,
          hsn: prod.hsn || '20019000'
        });

        stockUpdates.push({
          docRef: db.collection('products').doc(prod.id),
          productId: prod.id,
          variantId: itemInput.variantId,
          prevStock: prod.stock,
          newStock: prod.stock - itemInput.qty,
          qty: itemInput.qty
        });
      }

      // 4. Role-based discount validation (POS-3)
      if (discountPaise > 0) {
        if (userRole === 'owner' || userRole === 'admin_owner') {
          if (!discountReason || typeof discountReason !== 'string' || discountReason.trim().length === 0) {
            throw new ValidationError('A written reason is required for managerial discounts (POS-3)');
          }
        } else {
          // Staff and non-owner roles capped at lower of 5% and ₹100 (POS-3)
          const maxFivePercent = Math.floor((subtotalPaise * 5) / 100);
          const maxStaffDiscount = Math.min(maxFivePercent, 10000); // lower of 5% and ₹100 (POS-3)
          if (discountPaise > maxStaffDiscount) {
            throw new ValidationError(`Staff discount capped at lower of 5% and ₹100 (max ₹${maxStaffDiscount / 100} on this order) (POS-3)`);
          }
        }
      }

      const safeDiscountPaise = Math.min(discountPaise, subtotalPaise);
      const totalPaise = subtotalPaise - safeDiscountPaise;

      // 5. Sequential Invoice Number (POS-6, TAX-3)
      const fyString = getCurrentFinancialYearString();
      const invoiceNumber = await getNextInvoiceNumberInTransaction(transaction, fyString);

      // 6. Generate order ID and deduct inventory
      const orderId = generateOrderId();
      const orderRef = db.collection('orders').doc(orderId);

      for (const update of stockUpdates) {
        transaction.update(update.docRef, { stock: update.newStock });
        logInventoryChangeInTransaction(transaction, {
          productId: update.productId,
          variantId: update.variantId,
          previousStock: update.prevStock,
          newStock: update.newStock,
          delta: -update.qty,
          reason: 'POS_SALE_DEDUCT',
          orderId,
          actorUid: req.user!.uid
        });
      }

      // 7. Update shift counters if shift provided (POS-8)
      if (shiftId) {
        const isCash = cleanPaymentMethod === 'CASH';
        const shiftRef = db.collection('shifts').doc(shiftId);
        transaction.update(shiftRef, {
          ...(isCash ? { cashSalesPaise: admin.firestore.FieldValue.increment(totalPaise) } : { upiSalesPaise: admin.firestore.FieldValue.increment(totalPaise) }),
          salesCount: admin.firestore.FieldValue.increment(1)
        });
      }

      // 8. Order Document creation
      const orderData = {
        orderId,
        invoiceNumber,
        channel: 'OFFLINE_COUNTER',
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        status: 'DELIVERED',
        lines: orderLines,
        subtotalPaise,
        discountPaise: safeDiscountPaise,
        discountReason: safeDiscountPaise > 0 ? (discountReason || 'Staff discount') : null,
        deliveryFeePaise: 0,
        taxPaise: totalTaxPaise,
        totalPaise,
        total: totalPaise / 100,
        subtotal: subtotalPaise / 100,
        discount: safeDiscountPaise / 100,
        paymentMethod: cleanPaymentMethod,
        customerName: customerName || 'Retail Customer',
        customerPhone: customerPhone || null,
        staffUid: req.user!.uid,
        shiftId: shiftId || null,
        lateEntry: Boolean(lateEntry),
        version: 1,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(orderRef, orderData);

      // 9. Update stats_daily atomically (DB-5, INV-5)
      await recordSaleInDailyStatsInTransaction(transaction, {
        totalPaise,
        channel: 'OFFLINE_COUNTER',
        unitsCount: totalUnits
      });

      return {
        orderId,
        invoiceNumber,
        subtotalPaise,
        discountPaise: safeDiscountPaise,
        totalPaise,
        paymentMethod: cleanPaymentMethod,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      };
    });

    await logAuditEvent({
      action: 'POS_SALE_COMPLETED',
      actorUid: req.user.uid,
      targetRef: `orders/${result.orderId}`,
      outcome: 'SUCCESS',
      ip: req.ip,
      details: { invoiceNumber: result.invoiceNumber, totalPaise: result.totalPaise }
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
