/**
 * Satvik Swaad — Authoritative Quotes Controller
 * Authority: docs/SPEC.md Section 7.1 (PRICE-1 to PRICE-9, MONEY-6), Decision D16
 *
 * Rules:
 * - PRICE-1, MONEY-6: Client may send only IDs, quantities, and pincode. Client-supplied financial fields rejected.
 * - PRICE-3: Prices read from authoritative product database in real time.
 * - PRICE-4, PRICE-5: Delivery fees resolved from config/deliveryZones in Firestore.
 * - PRICE-7, Decision D16: Quotes are valid for exactly 10 minutes.
 * - PRICE-9: Cart requests quote and receives { quoteId, totalPaise, expiresAt, lines, ... }.
 */

import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { validateQuotePayload } from '../validation/orderSchema';
import { priceOrder, OrderLineInput, DiscountDoc, DeliveryZoneConfig } from '../pricing/pricingEngine';
import { db } from '../config/firebase';
import { ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export async function createQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Strict validation (MONEY-6: Reject any client-supplied prices, totals, or discounts)
    // Support either POST body or GET query params
    const rawPayload = req.method === 'GET' ? (req.query.payload ? JSON.parse(String(req.query.payload)) : req.query) : req.body;
    const validated = validateQuotePayload(rawPayload);

    // 2. Fetch authoritative products from Firestore catalog
    const orderLineInputs: OrderLineInput[] = [];

    for (const item of validated.items) {
      const productRef = db.collection('products').doc(item.productId);
      const snap = await productRef.get();

      if (!snap.exists) {
        throw new ValidationError(`Product '${item.productId}' not found in store catalog`);
      }

      const prodData = snap.data()!;
      if (prodData.available === false) {
        throw new ValidationError(`Product '${prodData.name || item.productId}' is currently unavailable`);
      }

      let variantLabel = '';
      let unitPricePaise = 0;
      let taxRatePercent = typeof prodData.taxRatePercent === 'number' ? prodData.taxRatePercent : 12;
      let hsn = prodData.hsn || '20019000';

      if (Array.isArray(prodData.variants) && prodData.variants.length > 0) {
        const activeVariants = prodData.variants.filter((v: any) => v && v.active !== false);
        let selectedVariant: any = undefined;

        if (item.variantId) {
          selectedVariant = activeVariants.find((v: any) => v.id === item.variantId);
          if (!selectedVariant) {
            throw new ValidationError(`Variant '${item.variantId}' not found for product '${item.productId}'`);
          }
        } else if (activeVariants.length > 0) {
          selectedVariant = activeVariants[0];
        }

        if (selectedVariant) {
          variantLabel = selectedVariant.label || '';
          unitPricePaise = typeof selectedVariant.pricePaise === 'number' && selectedVariant.pricePaise > 0
            ? selectedVariant.pricePaise
            : Math.round((selectedVariant.price || 0) * 100);
          if (typeof selectedVariant.taxRatePercent === 'number') {
            taxRatePercent = selectedVariant.taxRatePercent;
          }
          if (selectedVariant.hsn) {
            hsn = selectedVariant.hsn;
          }
        }
      } else {
        unitPricePaise = typeof prodData.pricePaise === 'number' && prodData.pricePaise > 0
          ? prodData.pricePaise
          : Math.round((prodData.price || 0) * 100);
      }

      if (unitPricePaise <= 0) {
        throw new ValidationError(`Invalid price configured for product '${item.productId}'`);
      }

      const lineTitle = variantLabel ? `${prodData.name} (${variantLabel})` : (prodData.name || 'Handcrafted Item');

      orderLineInputs.push({
        productId: item.productId,
        variantId: item.variantId || item.productId,
        title: lineTitle,
        unitPricePaise,
        qty: item.qty,
        taxRatePercent,
        hsn
      });
    }

    // 3. Fetch delivery zones configuration from config/deliveryZones (Decision D5, D17)
    let deliveryZones: DeliveryZoneConfig | undefined = undefined;
    try {
      const zonesSnap = await db.collection('config').doc('deliveryZones').get();
      if (zonesSnap.exists) {
        deliveryZones = zonesSnap.data() as DeliveryZoneConfig;
      }
    } catch (zoneErr) {
      logger.warn('Failed to load deliveryZones config, using fallback rules', { error: String(zoneErr) });
    }

    // 4. Fetch discount code if supplied (collection: discounts)
    let discountCodeDoc: DiscountDoc | null = null;
    if (validated.discountCode) {
      const codeUpper = validated.discountCode.toUpperCase();
      const discSnap = await db.collection('discounts').doc(codeUpper).get();
      if (discSnap.exists) {
        discountCodeDoc = discSnap.data() as DiscountDoc;
      }
    }

    // 5. Authoritative calculation via single pricingEngine.priceOrder (PRICE-1)
    const priced = priceOrder({
      items: orderLineInputs,
      pincode: validated.pincode || '',
      discountCodeDoc,
      deliveryZones
    });

    const quoteId = `qt_${crypto.randomBytes(12).toString('hex')}`;

    logger.info('Authoritative quote generated', {
      quoteId,
      subtotalPaise: priced.subtotalPaise,
      totalPaise: priced.totalPaise,
      pincode: validated.pincode
    });

    res.status(200).json({
      success: true,
      data: {
        quoteId,
        lines: priced.lines,
        subtotalPaise: priced.subtotalPaise,
        discountPaise: priced.discountPaise,
        deliveryFeePaise: priced.shippingPaise,
        taxPaise: priced.taxPaise,
        totalPaise: priced.totalPaise,
        // Decimal rupee helpers for frontend convenience
        subtotal: priced.subtotalPaise / 100,
        discount: priced.discountPaise / 100,
        shippingFee: priced.shippingPaise / 100,
        total: priced.totalPaise / 100,
        needsReview: priced.needsReview,
        quoteExpiresAt: priced.quoteExpiresAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}
