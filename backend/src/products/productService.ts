import { Transaction } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { ValidationError, OutOfStockError } from '../errors/AppError';

export interface AuthoritativeVariant {
  id: string;
  label: string;
  weightGrams: number;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  active: boolean;
}

export interface AuthoritativeProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  available: boolean;
  variants?: AuthoritativeVariant[];
}

export async function getAuthoritativeProductInTransaction(
  transaction: Transaction,
  productId: string,
  variantId?: string
): Promise<AuthoritativeProduct & { selectedVariant?: AuthoritativeVariant }> {
  const docRef = db.collection('products').doc(productId);
  const snap = await transaction.get(docRef);

  if (!snap.exists) {
    throw new ValidationError(`Product '${productId}' not found in store catalog`);
  }

  const data = snap.data()!;
  
  if (!data.available) {
    throw new OutOfStockError(`Product '${data.name || productId}' is currently unavailable`);
  }

  let selectedVariant: AuthoritativeVariant | undefined = undefined;
  let price = typeof data.price === 'number' ? data.price : 0;
  let mrp = typeof data.mrp === 'number' ? data.mrp : price;
  let stock = typeof data.stock === 'number' ? data.stock : 0;

  if (Array.isArray(data.variants) && data.variants.length > 0) {
    const activeVariants: AuthoritativeVariant[] = data.variants.filter((v: any) => v && v.active !== false);
    
    if (variantId) {
      const found = activeVariants.find((v: any) => v.id === variantId);
      if (!found) {
        throw new ValidationError(`Variant '${variantId}' not found or inactive for product '${productId}'`);
      }
      selectedVariant = found;
      price = found.price;
      mrp = found.mrp || price;
      stock = found.stock;
    } else if (activeVariants.length > 0) {
      selectedVariant = activeVariants[0];
      price = selectedVariant.price;
      mrp = selectedVariant.mrp || price;
      stock = selectedVariant.stock;
    }
  }

  if (price <= 0) {
    throw new ValidationError(`Invalid product price in catalog for '${productId}'`);
  }

  return {
    id: snap.id,
    name: data.name || 'Handcrafted Item',
    price,
    mrp,
    stock,
    available: data.available,
    variants: data.variants || [],
    selectedVariant
  };
}
