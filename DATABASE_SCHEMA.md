# DATABASE SCHEMA (PHASE 9 — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Complete Firestore Collection Schema Inventory  
**Date**: July 19, 2026  

---

## 1. Core Business Collections

### `/products/{productId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Stable product ID (e.g. `prod_mango_achar`) |
| `sku` | `string` | Legacy flat SKU (e.g. `SKU-ACH-001`) |
| `name` | `string` | Product display name |
| `cat` | `string` | Category code (`achar`, `murabba`, `chawmpras`, `ladoo`) |
| `desc` | `string` | Product description |
| `price` | `number` | Current selling price |
| `mrp` | `number` | Maximum retail price |
| `stock` | `number` | Current physical stock |
| `weightVariant` | `string` | Legacy weight string (`500g`) |
| `variants` | `array` | Variant-capable array (Phase 9 addition) |
| `variants[].variantId` | `string` | Unique variant ID |
| `variants[].sku` | `string` | Variant SKU (`SKU-ACH-001-500G`) |
| `variants[].weight` | `string` | Weight/size label |
| `variants[].price` | `number` | Variant price |
| `variants[].mrp` | `number` | Variant MRP |
| `variants[].stock` | `number` | Variant stock |
| `variants[].available` | `boolean` | Variant availability |
| `variants[].barcode` | `string|null` | GTIN/EAN (pending verification) |
| `emoji` | `string` | Display emoji |
| `img` | `string` | Image asset reference |
| `badge` | `string|null` | Badge label |
| `available` | `boolean` | Product availability |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/orders/{orderId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `orderId` | `string` | Unique order ID |
| `userId` | `string|null` | Authenticated user UID |
| `guestAccessSecretHash` | `string|null` | SHA-256 hash of guest access secret |
| `name` | `string` | Customer name |
| `phone` | `string` | Customer phone |
| `address` | `string` | Delivery address |
| `items` | `array` | Immutable order item snapshots |
| `items[].productId` | `string` | Product reference |
| `items[].sku` | `string` | SKU at time of purchase |
| `items[].name` | `string` | Product name snapshot |
| `items[].unitPrice` | `number` | Price at time of purchase |
| `items[].qty` | `number` | Quantity ordered |
| `items[].lineTotal` | `number` | Line total |
| `items[].weightVariant` | `string` | Weight at time of purchase |
| `subtotal` | `number` | Server-calculated subtotal |
| `shippingFee` | `number` | Shipping charge |
| `total` | `number` | Order total |
| `paymentMethod` | `string` | Payment method |
| `paymentStatus` | `string` | Payment status |
| `status` | `string` | Order status |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/orders/{orderId}/events/{eventId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `previousStatus` | `string` | Status before transition |
| `newStatus` | `string` | Status after transition |
| `actorUid` | `string` | Admin UID who made transition |
| `reason` | `string` | Transition reason |
| `timestamp` | `Timestamp` | Server timestamp |

### `/messages/{messageId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Sender name |
| `message` | `string` | Message body |
| `status` | `string` | `new` / `read` / `resolved` |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/reviews/{reviewId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `productId` | `string` | Product reference |
| `name` | `string` | Reviewer name |
| `rating` | `number` | Star rating |
| `text` | `string` | Review text |
| `approved` | `boolean` | Moderation status (default `false`) |
| `moderatedBy` | `string|null` | Moderator UID |
| `moderatedAt` | `Timestamp|null` | Moderation timestamp |
| `moderationReason` | `string|null` | Moderation reason |
| `createdAt` | `Timestamp` | Server timestamp |

---

## 2. Infrastructure Collections

### `/idempotency/{key}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `ownerId` | `string` | Authenticated UID or guest session |
| `action` | `string` | API action identifier |
| `requestHash` | `string` | SHA-256 of canonical request body |
| `result` | `object` | Cached response |
| `createdAt` | `Timestamp` | Server timestamp |

### `/rate_limits/{bucket}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `count` | `number` | Request count in window |
| `windowStart` | `Timestamp` | Sliding window start |

### `/audit_logs/{logId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `action` | `string` | Action identifier |
| `actorUid` | `string` | Actor UID |
| `targetRef` | `string` | Target document reference |
| `outcome` | `string` | `SUCCESS` / `FAILURE` |
| `details` | `object|null` | Safe metadata (no PII) |
| `ip` | `string` | Request IP |
| `timestamp` | `Timestamp` | Server timestamp |

---

## 3. Marketplace Collections (Phase 9 — Feature-Gated)

### `/marketplaceChannels/{channelId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/marketplaceListings/{listingId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/marketplaceOrders/{orderId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/inventoryLedger/{entryId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/marketplaceSyncJobs/{jobId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/marketplaceEvents/{eventId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

### `/marketplaceSettlements/{settlementId}`
See [`MARKETPLACE_DATA_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_DATA_MODEL.md) for complete schema.

---
*End of Database Schema.*
