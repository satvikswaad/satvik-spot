import * as crypto from 'crypto';

export interface GuestAccessDetails {
  plainSecret: string;
  hashedSecret: string;
}

/**
 * Generates a cryptographically secure, high-entropy guest access secret.
 * The raw secret is returned to the guest client ONCE upon order placement.
 * Only the SHA-256 hash of the secret is stored in the database.
 */
export function generateGuestAccessSecret(): GuestAccessDetails {
  const plainSecret = crypto.randomBytes(32).toString('hex'); // 64 hex characters
  const hashedSecret = crypto.createHash('sha256').update(plainSecret).digest('hex');
  return { plainSecret, hashedSecret };
}

/**
 * Hashes a user-provided guest secret string for verification against the database hash.
 */
export function hashGuestSecret(plainSecret: string): string {
  return crypto.createHash('sha256').update(plainSecret).digest('hex');
}

/**
 * DOCUMENTED LIMITATION:
 * Lost Guest Access Secrets:
 * If a guest user loses their order secret key, it CANNOT be recovered or decrypted by the server or admins,
 * as only the SHA-256 hash is stored in the database. To retrieve order status, the customer must contact
 * customer support for identity verification or register an account.
 */
