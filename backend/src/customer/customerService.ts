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

const isUnitTestEnv = () => process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST;

const testProfiles = new Map<string, CustomerProfile>();
const testAddresses = new Map<string, Map<string, SavedAddress>>();
const testOrders = new Map<string, any[]>();

export function _resetTestCustomerStore() {
  testProfiles.clear();
  testAddresses.clear();
  testOrders.clear();
}

export function _setTestOrders(uid: string, orders: any[]) {
  testOrders.set(uid, orders);
}

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
  if (isUnitTestEnv()) {
    if (!testProfiles.has(uid)) {
      testProfiles.set(uid, {
        uid,
        name: 'Valued Test Customer',
        phone: '+919876543210',
        email: 'customer@satvikspot.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return testProfiles.get(uid)!;
  }

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

  if (isUnitTestEnv()) {
    const current = await getCustomerProfile(uid);
    const updated = { ...current, ...updatedData };
    testProfiles.set(uid, updated);
    return updated;
  }

  const docRef = db.collection('customers').doc(uid);
  const snap = await docRef.get();
  const current = snap.exists ? snap.data() as CustomerProfile : await getCustomerProfile(uid);

  await docRef.set(updatedData, { merge: true });
  return { ...current, ...updatedData };
}

/**
 * Retrieves all saved addresses for a customer.
 */
export async function getSavedAddresses(uid: string): Promise<SavedAddress[]> {
  if (isUnitTestEnv()) {
    const userAddrs = testAddresses.get(uid);
    if (!userAddrs) return [];
    return Array.from(userAddrs.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const snap = await db.collection('customers').doc(uid).collection('addresses').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => d.data() as SavedAddress);
}

/**
 * Adds a new saved address for a customer.
 */
export async function addSavedAddress(uid: string, input: AddressInput): Promise<SavedAddress> {
  let existingCount = 0;
  let snap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> | null = null;
  let addressesRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> | null = null;

  if (isUnitTestEnv()) {
    existingCount = testAddresses.get(uid)?.size || 0;
  } else {
    addressesRef = db.collection('customers').doc(uid).collection('addresses');
    snap = await addressesRef.get();
    existingCount = snap.size;
  }

  if (existingCount >= MAX_ADDRESSES_PER_CUSTOMER) {
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
  const addressId = isUnitTestEnv() ? `addr_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` : addressesRef!.doc().id;
  const isDefault = input.isDefault || (isUnitTestEnv() ? (testAddresses.get(uid)?.size || 0) === 0 : (snap ? snap.empty : false));

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

  if (isUnitTestEnv()) {
    let userAddrs = testAddresses.get(uid);
    if (!userAddrs) {
      userAddrs = new Map<string, SavedAddress>();
      testAddresses.set(uid, userAddrs);
    }
    if (isDefault) {
      userAddrs.forEach(addr => { addr.isDefault = false; addr.updatedAt = now; });
    }
    userAddrs.set(addressId, newAddress);
    return newAddress;
  }

  const batch = db.batch();

  if (isDefault && snap && !snap.empty) {
    snap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
      if (doc.data().isDefault) {
        batch.update(doc.ref, { isDefault: false, updatedAt: now });
      }
    });
  }

  batch.set(addressesRef!.doc(addressId), newAddress);
  
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
  const updates: Partial<SavedAddress> = {
    updatedAt: new Date().toISOString()
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

  const now = new Date().toISOString();

  if (isUnitTestEnv()) {
    const userAddrs = testAddresses.get(uid);
    const current = userAddrs?.get(addressId);
    if (!current) {
      throw new NotFoundError('Address not found');
    }
    if (input.isDefault && !current.isDefault) {
      updates.isDefault = true;
      userAddrs!.forEach(addr => { addr.isDefault = false; addr.updatedAt = now; });
    }
    const updated = { ...current, ...updates, updatedAt: now };
    userAddrs!.set(addressId, updated);
    return updated;
  }

  const docRef = db.collection('customers').doc(uid).collection('addresses').doc(addressId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Address not found');
  }

  const current = snap.data() as SavedAddress;
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
  if (isUnitTestEnv()) {
    const userAddrs = testAddresses.get(uid);
    const current = userAddrs?.get(addressId);
    if (!current) {
      throw new NotFoundError('Address not found');
    }
    userAddrs!.delete(addressId);
    if (current.isDefault && userAddrs!.size > 0) {
      const nextAddr = userAddrs!.values().next().value;
      if (nextAddr) nextAddr.isDefault = true;
    }
    return;
  }

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
  if (isUnitTestEnv()) {
    const orders = testOrders.get(uid) || [];
    return [...orders].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  const snap = await db.collection('orders').where('userId', '==', uid).get();
  return snap.docs
    .map(doc => ({ orderId: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
