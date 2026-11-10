"use strict";
/**
 * Satvik Swaad — Authoritative Order Lifecycle State Machine
 * Authority: docs/SPEC.md Section 4 (STATE-1 to STATE-6) and Appendix A2
 *
 * Rules:
 * - STATE-1: Legal transitions live in this ONE file as an explicit whitelist.
 * - STATE-2: Runs inside a Firestore transaction (compare-and-set).
 * - STATE-3: Appends immutable record to orders/{id}/events.
 * - STATE-4: Same-state transition is an idempotent no-op returning success.
 * - STATE-5: Terminal orderStatus (CANCELLED, EXPIRED, DELIVERED, RETURNED) never change,
 *   except EXPIRED -> CONFIRMED for late payment revival (Section 4.3).
 * - STATE-6: Step-up operations require admin authentication within last 300 seconds.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitionError = void 0;
exports.isValidTransition = isValidTransition;
exports.getNextValidOrderStatuses = getNextValidOrderStatuses;
exports.getNextValidPaymentStatuses = getNextValidPaymentStatuses;
exports.assertStepUpFreshness = assertStepUpFreshness;
class TransitionError extends Error {
    statusCode;
    constructor(message, statusCode = 409) {
        super(`[StateTransitionError] ${message}`);
        this.name = 'TransitionError';
        this.statusCode = statusCode;
    }
}
exports.TransitionError = TransitionError;
/**
 * Valid forward transitions for orderStatus (Section 4.2 & Appendix A2)
 */
const ORDER_TRANSITIONS = {
    PLACED: ['PLACED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
    CONFIRMED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
    PROCESSING: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
    SHIPPED: ['SHIPPED', 'DELIVERED', 'RETURNED'],
    DELIVERED: ['DELIVERED', 'RETURNED'],
    CANCELLED: ['CANCELLED'], // Terminal (STATE-5)
    EXPIRED: ['EXPIRED', 'CONFIRMED'], // Terminal except late payment revival (Section 4.3)
    RETURNED: ['RETURNED'] // Terminal (STATE-5)
};
/**
 * Valid transitions for paymentStatus (Section 4.4 & Appendix A2)
 */
const PAYMENT_TRANSITIONS = {
    UNPAID: ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'COD_DUE', 'FAILED'],
    PENDING_VERIFICATION: ['PENDING_VERIFICATION', 'PAID', 'FAILED'],
    PAID: ['PAID', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED'],
    FAILED: ['FAILED', 'UNPAID'], // Customer retrying payment
    COD_DUE: ['COD_DUE', 'COD_COLLECTED', 'FAILED'],
    COD_COLLECTED: ['COD_COLLECTED', 'REFUND_PENDING'],
    REFUND_PENDING: ['REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
    PARTIALLY_REFUNDED: ['PARTIALLY_REFUNDED', 'REFUND_PENDING', 'REFUNDED'],
    REFUNDED: ['REFUNDED'], // Terminal
    DISPUTED: ['DISPUTED', 'PAID', 'REFUNDED']
};
/**
 * Actions that strictly require step-up authentication within 300 seconds (STATE-6, AUTH-5)
 */
const STEP_UP_REQUIRED_ACTIONS = new Set([
    'ORDER_CANCEL_AFTER_CONFIRMATION',
    'ORDER_MARK_RETURNED',
    'MANUAL_UPI_VERIFY',
    'REFUND_CREATE',
    'PRICE_MODIFY'
]);
/**
 * Checks whether a given transition is permitted under the specification whitelist.
 */
function isValidTransition(type, fromStatus, toStatus) {
    if (type === 'order') {
        const allowed = ORDER_TRANSITIONS[fromStatus];
        if (!allowed)
            return false;
        return allowed.includes(toStatus);
    }
    else {
        const allowed = PAYMENT_TRANSITIONS[fromStatus];
        if (!allowed)
            return false;
        return allowed.includes(toStatus);
    }
}
/**
 * Returns allowed next order statuses from current state.
 */
function getNextValidOrderStatuses(currentStatus) {
    return ORDER_TRANSITIONS[currentStatus] || [];
}
/**
 * Returns allowed next payment statuses from current state.
 */
function getNextValidPaymentStatuses(currentStatus) {
    return PAYMENT_TRANSITIONS[currentStatus] || [];
}
/**
 * Validates step-up authentication freshness. (STATE-6, AUTH-5)
 * Re-authentication must have occurred within the last 300 seconds.
 */
function assertStepUpFreshness(authTimestampSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
    const elapsed = nowSeconds - authTimestampSeconds;
    if (elapsed < 0 || elapsed > 300) {
        throw new TransitionError(`Step-up authentication expired or missing. Last auth was ${elapsed}s ago (maximum 300s). Re-authentication required.`, 403);
    }
}
