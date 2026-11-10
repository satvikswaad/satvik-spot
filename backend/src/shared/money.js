"use strict";
/**
 * Satvik Swaad — Canonical Money Engine
 * Authority: docs/SPEC.md Section 2.1 (MONEY-1 to MONEY-6)
 *
 * Rules:
 * - MONEY-1: All money is stored and computed as integer number of paise (₹1 = 100 paise).
 * - MONEY-2: Field names carry unit (subtotalPaise, totalPaise, etc.).
 * - MONEY-3: The ONLY place paise become a rupee string is formatRupees(paise),
 *   returning two decimals with no thousands separator (e.g. "499.00").
 * - MONEY-5: Tax rounds half-up to nearest paisa once per line.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoneyError = void 0;
exports.assertPaise = assertPaise;
exports.assertNonNegativePaise = assertNonNegativePaise;
exports.formatRupees = formatRupees;
exports.roundTaxPaise = roundTaxPaise;
class MoneyError extends Error {
    constructor(message) {
        super(`[MoneyError] ${message}`);
        this.name = 'MoneyError';
    }
}
exports.MoneyError = MoneyError;
/**
 * Asserts that a value is a strictly valid integer number of paise.
 * Throws MoneyError if value is not an integer number. (MONEY-1)
 */
function assertPaise(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new MoneyError(`Expected integer paise, received: ${String(value)} (${typeof value})`);
    }
}
/**
 * Asserts that a value is a non-negative integer number of paise. (MONEY-1)
 */
function assertNonNegativePaise(value) {
    assertPaise(value);
    if (value < 0) {
        throw new MoneyError(`Expected non-negative paise, received: ${value}`);
    }
}
/**
 * The ONLY place paise become a rupee string in the entire system. (MONEY-3)
 * Returns two decimals, no thousands separator, e.g. formatRupees(49900) === "499.00".
 * Used by PayU form fields, PayU hash inputs, and callback verification.
 */
function formatRupees(paise) {
    assertPaise(paise);
    const isNegative = paise < 0;
    const abs = Math.abs(paise);
    const rupees = Math.floor(abs / 100);
    const cents = abs % 100;
    const formatted = `${rupees}.${cents < 10 ? '0' : ''}${cents}`;
    return isNegative ? `-${formatted}` : formatted;
}
/**
 * Rounds raw computed tax paise half-up to nearest integer paisa. (MONEY-5)
 * Math.floor(x + 0.5) implements standard half-up rounding.
 */
function roundTaxPaise(rawPaise) {
    if (typeof rawPaise !== 'number' || !Number.isFinite(rawPaise)) {
        throw new MoneyError(`Invalid tax amount for rounding: ${String(rawPaise)}`);
    }
    return Math.floor(rawPaise + 0.5);
}
