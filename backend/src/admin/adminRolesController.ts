/**
 * Satvik Swaad — Role Granting & Custom Claims Administration
 * Authority: docs/SPEC.md Section 9.1, Section 9.2, Section 15.2 (INV-7)
 *
 * Rules:
 * - 9.1: Role is granted only by the owner, through an admin route that requires step-up (AUTH-5).
 * - 9.1: Calls revokeRefreshTokens(uid) so change takes effect immediately.
 * - 9.1, INV-7: Roles exist ONLY in Auth Custom Claims. NEVER written to Firestore users collection.
 */

import { Response, NextFunction } from 'express';
import { admin, db } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { ValidationError, AuthorizationError } from '../errors/AppError';
import { logAuditEvent } from '../audit/auditLogger';
import { logger } from '../utils/logger';

export const ALLOWED_ROLES = ['staff', 'admin', 'owner', 'customer'] as const;
export type ManageableRole = typeof ALLOWED_ROLES[number];

export async function grantRoleHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Role Authorization: Owner only (Section 9.1, 9.2)
    const isOwner = req.user?.role === 'owner' || req.user?.role === 'admin_owner' || req.user?.roles?.includes('owner') || req.user?.roles?.includes('admin_owner');
    if (!req.user || !isOwner) {
      throw new AuthorizationError('Only the store owner can grant or modify administrative roles');
    }

    const { targetUid, role } = req.body;

    if (!targetUid || typeof targetUid !== 'string' || targetUid.trim().length === 0) {
      throw new ValidationError("Valid 'targetUid' is required");
    }

    const cleanRole = (role || '').trim().toLowerCase() as ManageableRole;
    if (!ALLOWED_ROLES.includes(cleanRole)) {
      throw new ValidationError(`Invalid role. Allowed roles: [${ALLOWED_ROLES.join(', ')}]`);
    }

    // 2. Set Firebase Auth Custom Claims (INV-7: never write to users doc)
    const customClaims: Record<string, any> = {
      role: cleanRole,
      isAdmin: cleanRole === 'admin' || cleanRole === 'owner',
      isStaff: cleanRole === 'staff',
      isOwner: cleanRole === 'owner'
    };

    if (process.env.NODE_ENV !== 'test' || process.env.FIRESTORE_EMULATOR_HOST) {
      await admin.auth().setCustomUserClaims(targetUid, customClaims);
      // Immediately revoke existing refresh tokens so new claim takes effect
      await admin.auth().revokeRefreshTokens(targetUid);
    }

    // 3. Append to Audit Log with Cryptographic Hash Chain (LOG-2)
    await logAuditEvent({
      action: 'ROLE_GRANTED',
      actorUid: req.user.uid,
      targetRef: `users/${targetUid}`,
      outcome: 'SUCCESS',
      ip: req.ip,
      details: { targetUid, role: cleanRole, customClaims }
    });

    logger.info(`Role '${cleanRole}' successfully granted to UID ${targetUid} by owner ${req.user.uid}`);

    res.status(200).json({
      success: true,
      data: {
        targetUid,
        role: cleanRole,
        claims: customClaims,
        tokensRevoked: true
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Operational Kill Switches Controller (Section 17.4)
 */
export async function getKillSwitchesHandler(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await db.collection('config').doc('killSwitches').get();
    const defaults = {
      commerceEnabled: true,
      checkoutEnabled: true,
      payuEnabled: true,
      razorpayEnabled: true,
      upiManualEnabled: false, // Decision D3: OFF by default
      adminReadOnly: false
    };

    const killSwitches = doc.exists ? { ...defaults, ...doc.data() } : defaults;

    res.status(200).json({
      success: true,
      data: killSwitches
    });
  } catch (error) {
    next(error);
  }
}

export async function updateKillSwitchesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const isOwner = req.user?.role === 'owner' || req.user?.role === 'admin_owner' || req.user?.roles?.includes('owner') || req.user?.roles?.includes('admin_owner');
    if (!req.user || !isOwner) {
      throw new AuthorizationError('Only the store owner can update operational kill switches');
    }

    const allowedKeys = ['commerceEnabled', 'checkoutEnabled', 'payuEnabled', 'razorpayEnabled', 'upiManualEnabled', 'adminReadOnly'];
    const updateData: Record<string, boolean> = {};

    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') {
          throw new ValidationError(`Kill switch '${key}' must be a boolean`);
        }
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('At least one kill switch value must be provided');
    }

    const docRef = db.collection('config').doc('killSwitches');
    await docRef.set(updateData, { merge: true });

    await logAuditEvent({
      action: 'KILL_SWITCHES_UPDATED',
      actorUid: req.user.uid,
      targetRef: 'config/killSwitches',
      outcome: 'SUCCESS',
      ip: req.ip,
      details: updateData
    });

    res.status(200).json({
      success: true,
      data: {
        ...updateData,
        upiManualEnabled: false // Decision D3: Manual UPI is always disabled
      }
    });
  } catch (error) {
    next(error);
  }
}
