/**
 * Satvik Swaad — Canonical ID Generators & Token Helpers
 * Authority: docs/SPEC.md Section 2.2
 *
 * Rules:
 * - Order ID: SS- + 12 characters of Crockford base32 (crypto.randomBytes)
 * - PayU txnid: ss + 20 lowercase base32 characters, 22 characters total (crypto.randomBytes)
 * - Guest order token: 32 random bytes base64url, stored only as SHA-256 hash
 * - Never use non-cryptographic PRNGs, never use timestamps for identity
 */

import * as crypto from 'crypto';

// Crockford Base32 alphabet (excludes I, L, O, U to avoid human transcription confusion)
const CROCKFORD_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Standard lowercase base32 alphabet (RFC 4648 lowercase: a-z, 2-7)
const LOWER_BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * Generates an authoritative Order ID.
 * Format: "SS-" + 12 Crockford base32 characters (e.g. SS-7B9X4K2M8P1Q)
 */
export function generateOrderId(): string {
  const bytes = crypto.randomBytes(12);
  let id = 'SS-';
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i];
    id += CROCKFORD_BASE32_ALPHABET[byte % 32];
  }
  return id;
}

/**
 * Generates a PayU txnid.
 * Format: "ss" + 20 lowercase base32 characters = 22 characters total (e.g. ss3j7k9m2p4q8r1t5v6w0x)
 */
export function generatePayuTxnId(): string {
  const bytes = crypto.randomBytes(20);
  let txnid = 'ss';
  for (let i = 0; i < 20; i++) {
    const byte = bytes[i];
    txnid += LOWER_BASE32_ALPHABET[byte % 32];
  }
  return txnid;
}

/**
 * Generates a secure guest order token and its database SHA-256 hash. (Section 2.2 / AUTH-3)
 * The raw token is returned once to the client; only the SHA-256 hash is persisted.
 */
export function generateGuestToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Hashes a presented guest token with SHA-256 for database comparison.
 */
export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
