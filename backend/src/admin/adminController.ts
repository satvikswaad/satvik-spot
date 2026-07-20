import { Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { AppError, ValidationError, AuthorizationError } from '../errors/AppError';
import { logAuditEvent } from '../audit/auditLogger';

// ── PERMISSION GUARD HELPER ────────────────────────────────────────────────
function checkPermission(req: AuthenticatedRequest, requiredRole: string) {
  if (!req.user || !req.user.isAdmin) {
    throw new AuthorizationError('Administrative access required');
  }

  // If user has specific roles array, verify role. Default 'owner' or 'admin' has all roles.
  const roles = req.user.roles || [];
  if (roles.length > 0 && !roles.includes('owner') && !roles.includes(requiredRole)) {
    throw new AuthorizationError(`Insufficient permissions: '${requiredRole}' role required`);
  }
}

// ── 1. DASHBOARD SUMMARY ───────────────────────────────────────────────────
export async function getDashboardSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'order_manager');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [ordersSnap, productsSnap, messagesSnap, reviewsSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('products').get(),
      db.collection('messages').get(),
      db.collection('reviews').get()
    ]);

    let ordersToday = 0;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let preparingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let qualifyingRevenue = 0;

    ordersSnap.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt ? data.createdAt.toDate() : null;

      if (createdAt && createdAt >= startOfDay) {
        ordersToday++;
      }

      switch (data.status) {
        case 'Pending': pendingOrders++; break;
        case 'Confirmed': confirmedOrders++; break;
        case 'Preparing': preparingOrders++; break;
        case 'Delivered':
          deliveredOrders++;
          qualifyingRevenue += (data.total || 0); // Delivered orders count towards qualifying revenue
          break;
        case 'Cancelled': cancelledOrders++; break;
      }
    });

    let activeProducts = 0;
    let outOfStockProducts = 0;
    let lowStockProducts = 0;

    productsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.available) activeProducts++;
      if (data.stock === 0) outOfStockProducts++;
      else if (data.stock <= 5) lowStockProducts++;
    });

    const newMessages = messagesSnap.docs.filter(d => d.data().status === 'new').length;
    const pendingReviews = reviewsSnap.docs.filter(d => d.data().approved === false).length;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          ordersToday,
          pendingOrders,
          confirmedOrders,
          preparingOrders,
          deliveredOrders,
          cancelledOrders,
          qualifyingRevenue,
          activeProducts,
          outOfStockProducts,
          lowStockProducts,
          newMessages,
          pendingReviews,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ── 2. PRODUCT MANAGEMENT (CREATE / UPDATE / ARCHIVE / STOCK) ─────────────
export async function createAdminProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'catalog_manager');

    const ALLOWED_KEYS = new Set([
      'id', 'sku', 'name', 'cat', 'desc', 'price', 'mrp', 'stock', 'weightVariant', 'emoji', 'img', 'badge'
    ]);
    for (const key of Object.keys(req.body || {})) {
      if (!ALLOWED_KEYS.has(key)) {
        throw new ValidationError(`Forbidden or unexpected field in product payload: '${key}'`);
      }
    }

    const { id, sku, name, cat, desc, price, mrp, stock, weightVariant, emoji, img, badge } = req.body;

    if (!id || !sku || !name || price === undefined || price <= 0 || stock === undefined || stock < 0) {
      throw new ValidationError('Invalid product fields: ID, SKU, Name, Price (>0), and Stock (>=0) are required');
    }

    const docRef = db.collection('products').doc(id);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new AppError('Product with this ID already exists', 409, 'PRODUCT_EXISTS');
    }

    const skuSnap = await db.collection('products').where('sku', '==', String(sku).trim()).get();
    if (!skuSnap.empty) {
      throw new AppError('Product with this SKU already exists', 409, 'DUPLICATE_SKU');
    }

    const productData = {
      id,
      sku,
      name: String(name).trim(),
      cat: cat || 'achar',
      desc: String(desc || '').trim(),
      price: Number(price),
      mrp: Number(mrp || price),
      stock: Number(stock),
      weightVariant: weightVariant || '500g',
      emoji: emoji || '📦',
      img: img || 'assets/logo.png',
      badge: badge || null,
      available: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(productData);
    await logAuditEvent({
      action: 'PRODUCT_CREATED',
      actorUid: req.user!.uid,
      targetRef: id,
      outcome: 'SUCCESS',
      ip: req.ip
    });

    return res.status(201).json({ success: true, data: { productId: id } });
  } catch (error) {
    return next(error);
  }
}

export async function archiveAdminProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'catalog_manager');
    const { productId } = req.params;

    const docRef = db.collection('products').doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    await docRef.update({
      available: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'PRODUCT_ARCHIVED',
      actorUid: req.user!.uid,
      targetRef: productId,
      outcome: 'SUCCESS',
      ip: req.ip
    });

    return res.status(200).json({ success: true, data: { productId, available: false } });
  } catch (error) {
    return next(error);
  }
}

export async function updateAdminStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'catalog_manager');
    const { productId } = req.params;
    const { newStock, reason } = req.body;

    if (typeof newStock !== 'number' || newStock < 0) {
      throw new ValidationError('New stock must be a non-negative integer');
    }

    const docRef = db.collection('products').doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const previousStock = snap.data()?.stock || 0;
    await docRef.update({
      stock: newStock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'INVENTORY_ADJUSTED',
      actorUid: req.user!.uid,
      targetRef: productId,
      outcome: 'SUCCESS',
      details: { previousStock, newStock, reason: reason || 'Manual adjustment' },
      ip: req.ip
    });

    return res.status(200).json({ success: true, data: { productId, previousStock, newStock } });
  } catch (error) {
    return next(error);
  }
}

// ── 3. ORDER STATUS TRANSITIONS MATRIX ─────────────────────────────────────
const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Preparing', 'Cancelled'],
  'Preparing': ['Packed', 'Cancelled'],
  'Packed': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered', 'Cancelled'],
  'Delivered': [], // Terminal state
  'Cancelled': []  // Terminal state
};

export async function transitionOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'order_manager');
    const { orderId } = req.params;
    const { targetStatus, reason } = req.body;

    if (!targetStatus || typeof targetStatus !== 'string') {
      throw new ValidationError('Target status is required');
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const currentStatus = orderSnap.data()?.status || 'Pending';
    const permittedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];

    if (!permittedNext.includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${permittedNext.join(', ')}]`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const paymentStatus = targetStatus === 'Delivered' ? 'Paid' : orderSnap.data()?.paymentStatus;

    await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(orderRef);
      if (!freshSnap.exists) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      transaction.update(orderRef, {
        status: targetStatus,
        paymentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Record event log in order subcollection
      const eventRef = orderRef.collection('events').doc();
      transaction.set(eventRef, {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        actorUid: req.user!.uid,
        reason: reason || 'Admin status transition',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await logAuditEvent({
      action: 'ORDER_STATUS_TRANSITION',
      actorUid: req.user!.uid,
      targetRef: orderId,
      outcome: 'SUCCESS',
      details: { previousStatus: currentStatus, newStatus: targetStatus, reason },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      data: { orderId, previousStatus: currentStatus, newStatus: targetStatus, paymentStatus }
    });
  } catch (error) {
    return next(error);
  }
}

// ── 4. MESSAGE MANAGEMENT ──────────────────────────────────────────────────
export async function updateMessageStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'support_manager');
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'resolved'].includes(status)) {
      throw new ValidationError("Status must be 'new', 'read', or 'resolved'");
    }

    const docRef = db.collection('messages').doc(messageId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Message not found', 404, 'NOT_FOUND');
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'MESSAGE_STATUS_UPDATED',
      actorUid: req.user!.uid,
      targetRef: messageId,
      outcome: 'SUCCESS',
      details: { status },
      ip: req.ip
    });

    return res.status(200).json({ success: true, data: { messageId, status } });
  } catch (error) {
    return next(error);
  }
}

// ── 5. REVIEW MODERATION ───────────────────────────────────────────────────
export async function moderateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'review_moderator');
    const { reviewId } = req.params;
    const { approved, moderationReason } = req.body;

    if (typeof approved !== 'boolean') {
      throw new ValidationError('Approved status must be a boolean');
    }

    const docRef = db.collection('reviews').doc(reviewId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Review not found', 404, 'NOT_FOUND');
    }

    await docRef.update({
      approved,
      moderatedBy: req.user!.uid,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
      moderationReason: moderationReason || null
    });

    await logAuditEvent({
      action: 'REVIEW_MODERATED',
      actorUid: req.user!.uid,
      targetRef: reviewId,
      outcome: 'SUCCESS',
      details: { approved },
      ip: req.ip
    });

    return res.status(200).json({ success: true, data: { reviewId, approved } });
  } catch (error) {
    return next(error);
  }
}

// ── 6. AUDIT LOG VIEWER (OWNER ONLY) ───────────────────────────────────────
export async function getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'owner');

    const snap = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(50).get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.status(200).json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    return next(error);
  }
}
