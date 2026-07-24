import { db, admin } from '../config/firebase';
import { ValidationError, NotFoundError, AuthorizationError } from '../errors/AppError';
import { validateIndianMobileNumber } from '../config/businessConfig';

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  defaultAddressId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

const MAX_ADDRESSES_PER_CUSTOMER = 5;

/**
 * Normalizes and validates an Indian 6-digit PIN code.
 */
export function normalizePincode(pin: string): string {
  const cleaned = String(pin || '').replace(/\D/g, '');
  if (cleaned.length !== 6) {
    throw new ValidationError('PIN code must contain exactly 6 digits');
  }
  return cleaned;
}

/**
 * Normalizes and validates recipient mobile number.
 */
export function normalizePhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  const subscriber = digits.length > 10 ? digits.slice(-10) : digits;
  if (!validateIndianMobileNumber(subscriber)) {
    throw new ValidationError('Invalid 10-digit Indian mobile number');
  }
  return `+91${subscriber}`;
}

/**
 * Retrieves or initializes a customer profile.
 */
export async function getCustomerProfile(uid: string): Promise<CustomerProfile> {
  const docRef = db.collection('customers').doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    const legacySnap = await db.collection('users').doc(uid).get();
    if (legacySnap.exists) {
      const data = legacySnap.data()!;
      const profile: CustomerProfile = {
        uid,
        name: data.name || 'Valued Customer',
        phone: data.phone || '',
        email: data.email || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await docRef.set(profile);
      return profile;
    }

    const defaultProfile: CustomerProfile = {
      uid,
      name: 'Valued Customer',
      phone: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await docRef.set(defaultProfile);
    return defaultProfile;
  }

  return snap.data() as CustomerProfile;
}

/**
 * Updates an existing customer profile.
 */
export async function updateCustomerProfile(uid: string, updates: { name?: string; phone?: string; email?: string }): Promise<CustomerProfile> {
  const docRef = db.collection('customers').doc(uid);
  const snap = await docRef.get();
  
  const current = snap.exists ? snap.data() as CustomerProfile : await getCustomerProfile(uid);

  const updatedData: Partial<CustomerProfile> = {
    updatedAt: new Date().toISOString()
  };

  if (updates.name !== undefined) {
    const trimmedName = String(updates.name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new ValidationError('Name must be between 2 and 100 characters');
    }
    updatedData.name = trimmedName;
  }

  if (updates.phone !== undefined && updates.phone !== '') {
    updatedData.phone = normalizePhone(updates.phone);
  }

  if (updates.email !== undefined && updates.email !== '') {
    const trimmedEmail = String(updates.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new ValidationError('Invalid email address format');
    }
    updatedData.email = trimmedEmail;
  }

  await docRef.set(updatedData, { merge: true });
  return { ...current, ...updatedData };
}

/**
 * Retrieves all saved addresses for a customer.
 */
export async function getSavedAddresses(uid: string): Promise<SavedAddress[]> {
  const snap = await db.collection('customers').doc(uid).collection('addresses').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => d.data() as SavedAddress);
}

/**
 * Adds a new saved address for a customer.
 */
export async function addSavedAddress(uid: string, input: AddressInput): Promise<SavedAddress> {
  const addressesRef = db.collection('customers').doc(uid).collection('addresses');
  const snap = await addressesRef.get();

  if (snap.size >= MAX_ADDRESSES_PER_CUSTOMER) {
    throw new ValidationError(`Maximum address limit (${MAX_ADDRESSES_PER_CUSTOMER}) reached. Please edit or delete an existing address.`);
  }

  if (!['Home', 'Work', 'Other'].includes(input.label)) {
    throw new ValidationError('Address label must be Home, Work, or Other');
  }

  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('Recipient name is required (minimum 2 characters)');
  }

  if (!input.house || input.house.trim().length < 1) {
    throw new ValidationError('House/Flat/Building details are required');
  }

  if (!input.street || input.street.trim().length < 2) {
    throw new ValidationError('Street/Locality details are required');
  }

  if (!input.city || input.city.trim().length < 2) {
    throw new ValidationError('City is required');
  }

  if (!input.state || input.state.trim().length < 2) {
    throw new ValidationError('State is required');
  }

  const phone = normalizePhone(input.phone);
  const pincode = normalizePincode(input.pincode);
  const addressId = addressesRef.doc().id;
  const isDefault = input.isDefault || snap.empty; // First address is default automatically

  const now = new Date().toISOString();
  const newAddress: SavedAddress = {
    id: addressId,
    label: input.label,
    name: input.name.trim(),
    phone,
    house: input.house.trim(),
    street: input.street.trim(),
    landmark: input.landmark ? input.landmark.trim() : undefined,
    city: input.city.trim(),
    state: input.state.trim(),
    pincode,
    deliveryInstructions: input.deliveryInstructions ? input.deliveryInstructions.trim() : undefined,
    isDefault,
    createdAt: now,
    updatedAt: now
  };

  const batch = db.batch();

  if (isDefault && !snap.empty) {
    snap.docs.forEach(doc => {
      if (doc.data().isDefault) {
        batch.update(doc.ref, { isDefault: false, updatedAt: now });
      }
    });
  }

  batch.set(addressesRef.doc(addressId), newAddress);
  
  if (isDefault) {
    batch.set(db.collection('customers').doc(uid), { defaultAddressId: addressId, updatedAt: now }, { merge: true });
  }

  await batch.commit();
  return newAddress;
}

/**
 * Updates an existing saved address.
 */
export async function updateSavedAddress(uid: string, addressId: string, input: Partial<AddressInput>): Promise<SavedAddress> {
  const docRef = db.collection('customers').doc(uid).collection('addresses').doc(addressId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Address not found');
  }

  const current = snap.data() as SavedAddress;
  const now = new Date().toISOString();

  const updates: Partial<SavedAddress> = {
    updatedAt: now
  };

  if (input.label !== undefined) {
    if (!['Home', 'Work', 'Other'].includes(input.label)) {
      throw new ValidationError('Address label must be Home, Work, or Other');
    }
    updates.label = input.label;
  }

  if (input.name !== undefined) {
    if (input.name.trim().length < 2) throw new ValidationError('Recipient name required');
    updates.name = input.name.trim();
  }

  if (input.phone !== undefined) {
    updates.phone = normalizePhone(input.phone);
  }

  if (input.house !== undefined) {
    if (input.house.trim().length < 1) throw new ValidationError('House/Flat details required');
    updates.house = input.house.trim();
  }

  if (input.street !== undefined) {
    if (input.street.trim().length < 2) throw new ValidationError('Street details required');
    updates.street = input.street.trim();
  }

  if (input.landmark !== undefined) updates.landmark = input.landmark.trim();
  if (input.city !== undefined) updates.city = input.city.trim();
  if (input.state !== undefined) updates.state = input.state.trim();
  if (input.pincode !== undefined) updates.pincode = normalizePincode(input.pincode);
  if (input.deliveryInstructions !== undefined) updates.deliveryInstructions = input.deliveryInstructions.trim();

  const batch = db.batch();

  if (input.isDefault && !current.isDefault) {
    updates.isDefault = true;
    const allSnap = await db.collection('customers').doc(uid).collection('addresses').get();
    allSnap.docs.forEach(doc => {
      if (doc.id !== addressId && doc.data().isDefault) {
        batch.update(doc.ref, { isDefault: false, updatedAt: now });
      }
    });
    batch.set(db.collection('customers').doc(uid), { defaultAddressId: addressId, updatedAt: now }, { merge: true });
  }

  batch.update(docRef, updates);
  await batch.commit();

  return { ...current, ...updates };
}

/**
 * Deletes a saved address for a customer.
 */
export async function deleteSavedAddress(uid: string, addressId: string): Promise<void> {
  const docRef = db.collection('customers').doc(uid).collection('addresses').doc(addressId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Address not found');
  }

  const isDefault = snap.data()?.isDefault;
  await docRef.delete();

  if (isDefault) {
    const remaining = await db.collection('customers').doc(uid).collection('addresses').limit(1).get();
    if (!remaining.empty) {
      const nextDoc = remaining.docs[0];
      await nextDoc.ref.update({ isDefault: true, updatedAt: new Date().toISOString() });
      await db.collection('customers').doc(uid).set({ defaultAddressId: nextDoc.id, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      await db.collection('customers').doc(uid).set({ defaultAddressId: null, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }
}

/**
 * Retrieves all orders belonging to an authenticated customer.
 */
export async function getCustomerOrders(uid: string): Promise<any[]> {
  const snap = await db.collection('orders').where('userId', '==', uid).get();
  return snap.docs
    .map(doc => ({ orderId: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
