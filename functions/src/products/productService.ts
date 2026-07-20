import { Transaction } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { ValidationError, OutOfStockError } from '../errors/AppError';

export interface AuthoritativeProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  available: boolean;
}

export async function getAuthoritativeProductInTransaction(
  transaction: Transaction,
  productId: string
): Promise<AuthoritativeProduct> {
  const docRef = db.collection('products').doc(productId);
  const snap = await transaction.get(docRef);

  if (!snap.exists) {
    throw new ValidationError(`Product '${productId}' not found in store catalog`);
  }

  const data = snap.data()!;
  
  if (!data.available) {
    throw new OutOfStockError(`Product '${data.name || productId}' is currently unavailable`);
  }

  const price = typeof data.price === 'number' ? data.price : 0;
  const mrp = typeof data.mrp === 'number' ? data.mrp : price;
  const stock = typeof data.stock === 'number' ? data.stock : 0;

  if (price <= 0) {
    throw new ValidationError(`Invalid product price in catalog for '${productId}'`);
  }

  return {
    id: snap.id,
    name: data.name || 'Handcrafted Item',
    price,
    mrp,
    stock,
    available: data.available
  };
}
