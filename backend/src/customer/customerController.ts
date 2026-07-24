import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import {
  getCustomerProfile,
  updateCustomerProfile,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  getCustomerOrders
} from './customerService';
import { AuthorizationError } from '../errors/AppError';

export async function handleGetCustomerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const profile = await getCustomerProfile(req.user.uid);
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateCustomerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const profile = await updateCustomerProfile(req.user.uid, req.body);
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    return next(err);
  }
}

export async function handleGetSavedAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const addresses = await getSavedAddresses(req.user.uid);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    return next(err);
  }
}

export async function handleAddSavedAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const address = await addSavedAddress(req.user.uid, req.body);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateSavedAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const { addressId } = req.params;
    const address = await updateSavedAddress(req.user.uid, addressId, req.body);
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    return next(err);
  }
}

export async function handleDeleteSavedAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const { addressId } = req.params;
    await deleteSavedAddress(req.user.uid, addressId);
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function handleGetCustomerOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.uid) {
      throw new AuthorizationError('Authentication required');
    }
    const orders = await getCustomerOrders(req.user.uid);
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return next(err);
  }
}
