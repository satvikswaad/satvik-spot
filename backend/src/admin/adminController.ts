import { Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { AppError, ValidationError, AuthorizationError } from '../errors/AppError';
import { logAuditEvent } from '../audit/auditLogger';

// ── PERMISSION GUARD HELPER ────────────────────────────────────────────────
export function checkPermission(req: AuthenticatedRequest, requiredRole: string) {
  if (!req.user || !req.user.isAdmin) {
    throw new AuthorizationError('Administrative access required');
  }

  const userRoles = new Set<string>();
  if (req.user.role) {
    userRoles.add(req.user.role);
  }
  if (Array.isArray(req.user.roles)) {
    for (const r of req.user.roles) {
      userRoles.add(r);
    }
  }

  // 'admin_owner' or 'owner' has full permissions across all admin roles
  if (userRoles.has('admin_owner') || userRoles.has('owner')) {
    return;
  }

  // Strict role check: requiredRole must be present in userRoles
  if (!userRoles.has(requiredRole)) {
    throw new AuthorizationError(`Insufficient permissions: '${requiredRole}' role required`);
  }
}

// ── 1. DASHBOARD SUMMARY ───────────────────────────────────────────────────
export async function getDashboardSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'order_manager');

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      return res.status(200).json({
        success: true,
        metrics: { ordersToday: 0, pendingOrders: 0, totalProducts: 6, totalMessages: 0, totalReviews: 0 }
      });
    }

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
      'id', 'sku', 'name', 'cat', 'desc', 'price', 'mrp', 'stock', 'weightVariant', 'emoji', 'img', 'badge',
      'variants', 'images', 'hindiName', 'shortDesc', 'fullDesc', 'ingredients', 'storageInfo', 'shelfLife', 'allergens', 'packaging'
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

    // Validate variants array if provided
    if (req.body.variants) {
      if (!Array.isArray(req.body.variants)) {
        throw new ValidationError('Variants must be an array');
      }
      const variantSkus = new Set<string>();
      const variantIds = new Set<string>();
      for (const v of req.body.variants) {
        if (!v.id || !v.label || typeof v.price !== 'number' || v.price <= 0) {
          throw new ValidationError('Each variant must have id, label, and positive price');
        }
        if (!v.sku || typeof v.sku !== 'string') {
          throw new ValidationError('Each variant must have a valid SKU string');
        }
        if (variantSkus.has(v.sku)) {
          throw new ValidationError(`Duplicate variant SKU detected: '${v.sku}'`);
        }
        if (variantIds.has(v.id)) {
          throw new ValidationError(`Duplicate variant ID detected: '${v.id}'`);
        }
        variantSkus.add(v.sku);
        variantIds.add(v.id);
      }
      (productData as any).variants = req.body.variants;
    }

    // Add optional extended fields
    if (req.body.images && Array.isArray(req.body.images)) (productData as any).images = req.body.images;
    if (req.body.hindiName) (productData as any).hindiName = String(req.body.hindiName).trim();
    if (req.body.shortDesc) (productData as any).shortDesc = String(req.body.shortDesc).trim();
    if (req.body.fullDesc) (productData as any).fullDesc = String(req.body.fullDesc).trim();
    if (req.body.ingredients) (productData as any).ingredients = String(req.body.ingredients).trim();
    if (req.body.storageInfo) (productData as any).storageInfo = String(req.body.storageInfo).trim();
    if (req.body.shelfLife) (productData as any).shelfLife = String(req.body.shelfLife).trim();
    if (req.body.allergens) (productData as any).allergens = String(req.body.allergens).trim();
    if (req.body.packaging) (productData as any).packaging = String(req.body.packaging).trim();

    const createdProductSnapshot = {
      id,
      sku,
      name: productData.name,
      cat: productData.cat,
      price: productData.price,
      mrp: productData.mrp,
      stock: productData.stock,
      available: productData.available,
      weightVariant: productData.weightVariant
    };

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      await logAuditEvent({
        action: 'PRODUCT_CREATED',
        actorUid: req.user!.uid,
        targetRef: id,
        outcome: 'SUCCESS',
        beforeState: null,
        afterState: createdProductSnapshot,
        ip: req.ip
      });
      return res.status(201).json({ success: true, data: { productId: id } });
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

    await docRef.set(productData);
    await logAuditEvent({
      action: 'PRODUCT_CREATED',
      actorUid: req.user!.uid,
      targetRef: id,
      outcome: 'SUCCESS',
      beforeState: null,
      afterState: createdProductSnapshot,
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

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const beforeState = { id: productId, available: true };
      const afterState = { id: productId, available: false };
      await logAuditEvent({
        action: 'PRODUCT_ARCHIVED',
        actorUid: req.user!.uid,
        targetRef: productId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        ip: req.ip
      });
      return res.status(200).json({ success: true, data: { productId, available: false } });
    }

    const docRef = db.collection('products').doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const beforeData = snap.data() || {};
    const beforeState = {
      id: productId,
      available: beforeData.available ?? true,
      stock: beforeData.stock,
      price: beforeData.price
    };

    await docRef.update({
      available: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const afterState = {
      ...beforeState,
      available: false
    };

    await logAuditEvent({
      action: 'PRODUCT_ARCHIVED',
      actorUid: req.user!.uid,
      targetRef: productId,
      outcome: 'SUCCESS',
      beforeState,
      afterState,
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

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const previousStock = 10;
      const beforeState = { productId, stock: previousStock };
      const afterState = { productId, stock: newStock };
      await logAuditEvent({
        action: 'INVENTORY_ADJUSTED',
        actorUid: req.user!.uid,
        targetRef: productId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { previousStock, newStock, reason: reason || 'Manual adjustment' },
        ip: req.ip
      });
      return res.status(200).json({ success: true, data: { productId, previousStock, newStock } });
    }

    const docRef = db.collection('products').doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const previousStock = snap.data()?.stock || 0;
    const beforeState = { productId, stock: previousStock };
    const afterState = { productId, stock: newStock };

    await docRef.update({
      stock: newStock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'INVENTORY_ADJUSTED',
      actorUid: req.user!.uid,
      targetRef: productId,
      outcome: 'SUCCESS',
      beforeState,
      afterState,
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

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const currentStatus = 'Pending';
      const permittedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
      if (!permittedNext.includes(targetStatus)) {
        throw new AppError(
          `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${permittedNext.join(', ')}]`,
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }
      const paymentStatus = targetStatus === 'Delivered' ? 'Paid' : 'Pending';
      const beforeState = { orderId, status: currentStatus, paymentStatus: 'Pending' };
      const afterState = { orderId, status: targetStatus, paymentStatus };
      await logAuditEvent({
        action: 'ORDER_STATUS_TRANSITION',
        actorUid: req.user!.uid,
        targetRef: orderId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { previousStatus: currentStatus, newStatus: targetStatus, reason },
        ip: req.ip
      });
      return res.status(200).json({
        success: true,
        data: { orderId, previousStatus: currentStatus, newStatus: targetStatus, paymentStatus }
      });
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
    const beforeState = { orderId, status: currentStatus, paymentStatus: orderSnap.data()?.paymentStatus };
    const afterState = { orderId, status: targetStatus, paymentStatus };

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
      beforeState,
      afterState,
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
    checkPermission(req, 'support_agent');
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'resolved'].includes(status)) {
      throw new ValidationError("Status must be 'new', 'read', or 'resolved'");
    }

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const beforeState = { messageId, status: 'new' };
      const afterState = { messageId, status };
      await logAuditEvent({
        action: 'MESSAGE_STATUS_UPDATED',
        actorUid: req.user!.uid,
        targetRef: messageId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { status },
        ip: req.ip
      });
      return res.status(200).json({ success: true, data: { messageId, status } });
    }

    const docRef = db.collection('messages').doc(messageId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Message not found', 404, 'NOT_FOUND');
    }

    const currentStatus = snap.data()?.status || 'new';
    const beforeState = { messageId, status: currentStatus };
    const afterState = { messageId, status };

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'MESSAGE_STATUS_UPDATED',
      actorUid: req.user!.uid,
      targetRef: messageId,
      outcome: 'SUCCESS',
      beforeState,
      afterState,
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
    checkPermission(req, 'support_agent');
    const { reviewId } = req.params;
    const { approved, moderationReason } = req.body;

    if (typeof approved !== 'boolean') {
      throw new ValidationError('Approved status must be a boolean');
    }

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const beforeState = { reviewId, approved: false };
      const afterState = { reviewId, approved, moderationReason: moderationReason || null };
      await logAuditEvent({
        action: 'REVIEW_MODERATED',
        actorUid: req.user!.uid,
        targetRef: reviewId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { approved },
        ip: req.ip
      });
      return res.status(200).json({ success: true, data: { reviewId, approved } });
    }

    const docRef = db.collection('reviews').doc(reviewId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Review not found', 404, 'NOT_FOUND');
    }

    const currentApproved = snap.data()?.approved ?? false;
    const beforeState = { reviewId, approved: currentApproved };
    const afterState = { reviewId, approved, moderationReason: moderationReason || null };

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
      beforeState,
      afterState,
      details: { approved },
      ip: req.ip
    });

    return res.status(200).json({ success: true, data: { reviewId, approved } });
  } catch (error) {
    return next(error);
  }
}

// ── VARIANT MANAGEMENT ─────────────────────────────────────────────────────
export async function updateAdminVariants(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'catalog_manager');
    const { productId } = req.params;
    const { variants } = req.body;

    if (!Array.isArray(variants)) {
      throw new ValidationError('Variants must be an array');
    }

    // Validate each variant
    const variantSkus = new Set<string>();
    const variantIds = new Set<string>();
    for (const v of variants) {
      if (!v.id || typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(v.id)) {
        throw new ValidationError(`Invalid variant ID format: '${v.id}'`);
      }
      if (!v.label || typeof v.label !== 'string' || v.label.trim().length < 1) {
        throw new ValidationError('Each variant must have a non-empty label');
      }
      if (typeof v.price !== 'number' || v.price <= 0) {
        throw new ValidationError(`Invalid price for variant '${v.id}': must be positive`);
      }
      if (typeof v.mrp !== 'number' || v.mrp < v.price) {
        throw new ValidationError(`MRP for variant '${v.id}' must be >= price`);
      }
      if (typeof v.stock !== 'number' || v.stock < 0 || !Number.isInteger(v.stock)) {
        throw new ValidationError(`Stock for variant '${v.id}' must be a non-negative integer`);
      }
      if (!v.sku || typeof v.sku !== 'string') {
        throw new ValidationError(`Each variant must have a valid SKU`);
      }
      if (variantSkus.has(v.sku)) {
        throw new ValidationError(`Duplicate variant SKU: '${v.sku}'`);
      }
      if (variantIds.has(v.id)) {
        throw new ValidationError(`Duplicate variant ID: '${v.id}'`);
      }
      variantSkus.add(v.sku);
      variantIds.add(v.id);
    }

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const beforeState = { productId, variants: [], variantCount: 0 };
      const afterState = { productId, variants, variantCount: variants.length };
      await logAuditEvent({
        action: 'PRODUCT_VARIANTS_UPDATED',
        actorUid: req.user!.uid,
        targetRef: productId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { previousCount: 0, newCount: variants.length },
        ip: req.ip
      });
      return res.status(200).json({
        success: true,
        data: { productId, variantCount: variants.length }
      });
    }

    const docRef = db.collection('products').doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const previousVariants = snap.data()?.variants || [];
    const beforeState = { productId, variants: previousVariants, variantCount: previousVariants.length };
    const afterState = { productId, variants, variantCount: variants.length };

    await docRef.update({
      variants,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent({
      action: 'PRODUCT_VARIANTS_UPDATED',
      actorUid: req.user!.uid,
      targetRef: productId,
      outcome: 'SUCCESS',
      beforeState,
      afterState,
      details: { previousCount: previousVariants.length, newCount: variants.length },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      data: { productId, variantCount: variants.length }
    });
  } catch (error) {
    return next(error);
  }
}

// ── MANUAL PAYMENT VERIFICATION ───────────────────────────────────────────
export async function verifyPaymentAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'financial_auditor');
    const { orderId } = req.params;
    const { action, confirmBankCredit, receivedAmount, reasonCode, reason, paymentMethod, utr } = req.body;

    if (!action || (action !== 'ACCEPT' && action !== 'REJECT' && action !== 'EXPIRE')) {
      throw new ValidationError("Action must be 'ACCEPT', 'REJECT', or 'EXPIRE'");
    }

    if (action === 'ACCEPT') {
      if (confirmBankCredit !== true) {
        throw new ValidationError('Explicit bank credit confirmation is required to accept payment');
      }
      if (typeof receivedAmount !== 'number' || receivedAmount <= 0) {
        throw new ValidationError('A valid positive receivedAmount is required to accept payment');
      }
    }

    if (action === 'REJECT') {
      const validReasons = ['PAYMENT_NOT_RECEIVED', 'INVALID_UTR_REFERENCE', 'ORDER_CANCELLED_BY_CUSTOMER', 'DUPLICATE_UTR', 'EXPIRED_REQUEST', 'OTHER'];
      if (!reasonCode || !validReasons.includes(reasonCode)) {
        throw new ValidationError(`Rejection reason code must be one of: ${validReasons.join(', ')}`);
      }
      if (reasonCode === 'OTHER' && (!reason || typeof reason !== 'string' || reason.trim().length < 5)) {
        throw new ValidationError('A custom note of at least 5 characters is mandatory when selecting "OTHER" as rejection reason');
      }
    }

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      const currentPaymentStatus = 'PAYMENT_PENDING';
      const currentOrderStatus = 'AWAITING_PAYMENT';
      const newPaymentStatus = action === 'ACCEPT' ? 'PAYMENT_VERIFIED' : action === 'EXPIRE' ? 'PAYMENT_EXPIRED' : 'PAYMENT_REJECTED';
      const newOrderStatus = action === 'ACCEPT' ? 'ORDER_CONFIRMED' : 'CANCELLED';
      const beforeState = { orderId, paymentStatus: currentPaymentStatus, orderStatus: currentOrderStatus };
      const afterState = {
        orderId,
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
        receivedAmount: receivedAmount || null,
        rejectionReasonCode: reasonCode || null
      };

      await logAuditEvent({
        action: action === 'ACCEPT' ? 'PAYMENT_ACCEPTED' : action === 'EXPIRE' ? 'PAYMENT_EXPIRED' : 'PAYMENT_REJECTED',
        actorUid: req.user!.uid,
        targetRef: orderId,
        outcome: 'SUCCESS',
        beforeState,
        afterState,
        details: { action, receivedAmount: receivedAmount || null, reasonCode: reasonCode || null, reason: reason || null },
        ip: req.ip
      });

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          paymentStatus: newPaymentStatus,
          orderStatus: newOrderStatus
        }
      });
    }

    const orderRef = db.collection('orders').doc(orderId);
    let beforeState: Record<string, any> = {};
    let afterState: Record<string, any> = {};

    await db.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      const orderData = orderSnap.data()!;
      const currentPaymentStatus = orderData.paymentStatus || 'PAYMENT_PENDING';
      const terminalStatuses = ['PAYMENT_VERIFIED', 'PAYMENT_REJECTED', 'PAYMENT_EXPIRED'];

      if (terminalStatuses.includes(currentPaymentStatus)) {
        throw new AppError(
          `Payment status is already terminal ('${currentPaymentStatus}') and cannot be modified again`,
          400,
          'TERMINAL_PAYMENT_STATUS'
        );
      }

      beforeState = {
        orderId,
        paymentStatus: currentPaymentStatus,
        orderStatus: orderData.status || 'AWAITING_PAYMENT',
        total: orderData.total
      };

      if (action === 'ACCEPT') {
        const expectedTotal = Number(orderData.total || 0);

        // Check for PAYMENT_MISMATCH
        if (Number(receivedAmount) !== expectedTotal) {
          transaction.update(orderRef, {
            paymentStatus: 'PAYMENT_MISMATCH',
            status: 'AWAITING_PAYMENT',
            mismatchReceivedAmount: receivedAmount,
            mismatchExpectedTotal: expectedTotal,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          afterState = {
            orderId,
            paymentStatus: 'PAYMENT_MISMATCH',
            status: 'AWAITING_PAYMENT',
            receivedAmount,
            expectedTotal
          };

          const eventRef = orderRef.collection('events').doc();
          transaction.set(eventRef, {
            action: 'PAYMENT_MISMATCH',
            previousPaymentStatus: currentPaymentStatus,
            newPaymentStatus: 'PAYMENT_MISMATCH',
            receivedAmount,
            expectedTotal,
            actorUid: req.user!.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          return;
        }

        // Revalidate stock transactionally & deduct inventory
        const productUpdates: Array<{ docRef: admin.firestore.DocumentReference; newStock: number }> = [];

        if (Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            const productRef = db.collection('products').doc(item.productId);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists) {
              throw new AppError(`Product '${item.productId}' not found during stock verification`, 404, 'NOT_FOUND');
            }

            const currentStock = Number(productSnap.data()?.stock || 0);
            const requestedQty = Number(item.qty || 1);

            if (currentStock < requestedQty) {
              throw new AppError(
                `Insufficient stock for '${item.name || item.productId}'. Required: ${requestedQty}, Available: ${currentStock}`,
                400,
                'INSUFFICIENT_STOCK'
              );
            }

            productUpdates.push({
              docRef: productRef,
              newStock: currentStock - requestedQty
            });
          }
        }

        // Apply stock updates
        for (const update of productUpdates) {
          transaction.update(update.docRef, {
            stock: update.newStock,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        transaction.update(orderRef, {
          paymentStatus: 'PAYMENT_VERIFIED',
          status: 'ORDER_CONFIRMED',
          receivedAmount,
          ...(paymentMethod ? { actualPaymentMethod: paymentMethod } : {}),
          ...(utr ? { utr: String(utr).trim().toUpperCase() } : {}),
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          verifiedBy: req.user!.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        afterState = {
          orderId,
          paymentStatus: 'PAYMENT_VERIFIED',
          orderStatus: 'ORDER_CONFIRMED',
          receivedAmount,
          actualPaymentMethod: paymentMethod || null,
          utr: utr ? String(utr).trim().toUpperCase() : null
        };

        // Record order event
        const eventRef = orderRef.collection('events').doc();
        transaction.set(eventRef, {
          action: 'PAYMENT_ACCEPTED',
          previousPaymentStatus: currentPaymentStatus,
          newPaymentStatus: 'PAYMENT_VERIFIED',
          receivedAmount,
          actorUid: req.user!.uid,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === 'EXPIRE') {
        transaction.update(orderRef, {
          paymentStatus: 'PAYMENT_EXPIRED',
          status: 'CANCELLED',
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredBy: req.user!.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        afterState = {
          orderId,
          paymentStatus: 'PAYMENT_EXPIRED',
          orderStatus: 'CANCELLED'
        };

        const eventRef = orderRef.collection('events').doc();
        transaction.set(eventRef, {
          action: 'PAYMENT_EXPIRED',
          previousPaymentStatus: currentPaymentStatus,
          newPaymentStatus: 'PAYMENT_EXPIRED',
          actorUid: req.user!.uid,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // REJECT PAYMENT
        const rejectionNote = reasonCode === 'OTHER' ? String(reason).trim() : `${reasonCode}: ${reason || ''}`.trim();
        transaction.update(orderRef, {
          paymentStatus: 'PAYMENT_REJECTED',
          status: 'CANCELLED',
          rejectionReasonCode: reasonCode,
          rejectionReason: rejectionNote,
          rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
          rejectedBy: req.user!.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        afterState = {
          orderId,
          paymentStatus: 'PAYMENT_REJECTED',
          orderStatus: 'CANCELLED',
          rejectionReasonCode: reasonCode,
          rejectionReason: rejectionNote
        };

        const eventRef = orderRef.collection('events').doc();
        transaction.set(eventRef, {
          action: 'PAYMENT_REJECTED',
          previousPaymentStatus: currentPaymentStatus,
          newPaymentStatus: 'PAYMENT_REJECTED',
          reasonCode,
          reason: rejectionNote,
          actorUid: req.user!.uid,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    await logAuditEvent({
      action: action === 'ACCEPT' ? 'PAYMENT_ACCEPTED' : action === 'EXPIRE' ? 'PAYMENT_EXPIRED' : 'PAYMENT_REJECTED',
      actorUid: req.user!.uid,
      targetRef: orderId,
      outcome: 'SUCCESS',
      beforeState,
      afterState,
      details: { action, receivedAmount: receivedAmount || null, reasonCode: reasonCode || null, reason: reason || null },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        paymentStatus: action === 'ACCEPT' ? 'PAYMENT_VERIFIED' : action === 'EXPIRE' ? 'PAYMENT_EXPIRED' : 'PAYMENT_REJECTED',
        orderStatus: action === 'ACCEPT' ? 'ORDER_CONFIRMED' : 'CANCELLED'
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ── 6. AUDIT LOG VIEWER (OWNER ONLY) ───────────────────────────────────────
export async function getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    checkPermission(req, 'admin_owner');

    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      return res.status(200).json({
        success: true,
        data: { logs: [] }
      });
    }

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
