/**
 * Satvik Swaad — Public Product Catalog Controller
 * Authority: docs/SPEC.md Section 8.3 (STOCK-2, STOCK-3, STOCK-7), Section 7.1
 *
 * Rules:
 * - STOCK-2: The public API returns `inStock` and `lowStock` flags only.
 *   Exact stock quantities are NEVER returned to public callers.
 * - STOCK-3: `lowStock` is true when available stock <= lowStockUnits threshold (default 5).
 * - STOCK-7: Product documents can carry batch code (`batchId` / `batchCode`) and `bestBeforeDate`.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { CONFIG_LIMITS } from '../shared/constants';
import { NotFoundError } from '../errors/AppError';

export function sanitizePublicProduct(prodData: Record<string, any>, id: string): Record<string, any> {
  const threshold = CONFIG_LIMITS.lowStockUnits || 5;
  const rawStock = typeof prodData.stock === 'number' ? prodData.stock : 0;
  const inStock = rawStock > 0 && prodData.available !== false;
  const lowStock = inStock && rawStock <= threshold;

  // Mask variants stock
  let maskedVariants: any[] | undefined = undefined;
  if (Array.isArray(prodData.variants)) {
    maskedVariants = prodData.variants
      .filter((v: any) => v && v.active !== false)
      .map((v: any) => {
        const vStock = typeof v.stock === 'number' ? v.stock : 0;
        const vInStock = vStock > 0;
        const vLowStock = vInStock && vStock <= threshold;

        // Clone variant without exposing exact stock integer
        const { stock: _s, ...safeVariant } = v;
        return {
          ...safeVariant,
          inStock: vInStock,
          lowStock: vLowStock,
          pricePaise: typeof safeVariant.pricePaise === 'number' ? safeVariant.pricePaise : Math.round((safeVariant.price || 0) * 100),
          batchId: safeVariant.batchId || prodData.batchId || null,
          bestBeforeDate: safeVariant.bestBeforeDate || prodData.bestBeforeDate || null
        };
      });
  }

  // Clone top-level doc without exposing exact stock integer
  const { stock: _st, ...safeProduct } = prodData;

  return {
    ...safeProduct,
    id,
    inStock,
    lowStock,
    pricePaise: typeof safeProduct.pricePaise === 'number' ? safeProduct.pricePaise : Math.round((safeProduct.price || 0) * 100),
    variants: maskedVariants,
    batchId: prodData.batchId || null,
    bestBeforeDate: prodData.bestBeforeDate || null
  };
}

export async function getPublicProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const snap = await db.collection('products')
      .where('available', '==', true)
      .get();

    const products = snap.docs.map(doc => sanitizePublicProduct(doc.data(), doc.id));

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId } = req.params;
    const snap = await db.collection('products').doc(productId).get();

    if (!snap.exists) {
      throw new NotFoundError(`Product '${productId}' not found`);
    }

    const data = snap.data()!;
    if (data.available === false) {
      throw new NotFoundError(`Product '${productId}' is not available`);
    }

    const publicProduct = sanitizePublicProduct(data, snap.id);

    res.status(200).json({
      success: true,
      data: publicProduct
    });
  } catch (error) {
    next(error);
  }
}
