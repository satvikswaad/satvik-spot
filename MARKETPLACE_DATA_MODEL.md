# MARKETPLACE DATA MODEL

**Project**: Satwik Sweets and Pickels  
**Scope**: Firestore Collections for Multi-Channel Marketplace Integration  
**Date**: July 19, 2026  

---

## 1. Collection Schemas

### `/marketplaceChannels/{channelId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `channelId` | `string` | `amazon_in`, `flipkart_in`, future channels |
| `displayName` | `string` | Human-readable channel name |
| `enabled` | `boolean` | Feature flag — **defaults to `false`** |
| `status` | `string` | `disabled` / `authorizing` / `connected` / `suspended` / `error` / `revoked` |
| `sellerAccountRef` | `string` | Opaque reference (never raw credentials) |
| `lastHealthCheck` | `Timestamp` | Last successful API health check |
| `enabledBy` | `string` | UID of owner who enabled the connector |
| `enabledAt` | `Timestamp` | When connector was enabled |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/marketplaceListings/{listingId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `internalProductId` | `string` | Reference to `/products/{id}` |
| `internalVariantId` | `string` | Reference to variant within product |
| `internalSKU` | `string` | Internal canonical SKU (e.g. `SKU-ACH-001-500G`) |
| `channel` | `string` | `amazon_in` or `flipkart_in` |
| `sellerAccountRef` | `string` | Opaque account reference |
| `marketplaceListingId` | `string` | ASIN, FSN, or platform identifier |
| `sellerSKU` | `string` | Marketplace-specific seller SKU |
| `listingStatus` | `string` | `draft` / `pending` / `active` / `suppressed` / `archived` |
| `channelTitle` | `string` | Marketplace-specific product title |
| `channelDescription` | `string` | Marketplace-specific description |
| `channelPrice` | `number` | Channel selling price |
| `channelMRP` | `number` | Listed MRP (must match printed MRP) |
| `channelTaxCategory` | `string` | HSN code or marketplace tax category |
| `fulfilmentMode` | `string` | `self_ship` / `easy_ship` / `fba` / `flipkart_fulfilment` |
| `lastSyncTime` | `Timestamp` | Last successful sync |
| `lastSyncStatus` | `string` | `success` / `partial` / `failed` |
| `syncErrorCodes` | `array<string>` | Marketplace error codes from last sync |
| `version` | `number` | Optimistic concurrency version |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/marketplaceOrders/{orderId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `channel` | `string` | Source channel |
| `marketplaceOrderId` | `string` | Amazon/Flipkart order reference |
| `marketplaceOrderItemId` | `string` | Line-item reference |
| `internalOrderRef` | `string` | Reference to `/orders/{id}` (created after normalization) |
| `fulfilmentMode` | `string` | Fulfilment mode |
| `channelStatus` | `string` | Original marketplace status string |
| `normalizedStatus` | `string` | Internal normalized status |
| `financialState` | `string` | `pending` / `invoiced` / `settled` / `refunded` |
| `importedAt` | `Timestamp` | When event was first received |
| `lastSyncedAt` | `Timestamp` | Last sync with marketplace |
| `rawPayloadRef` | `string` | Reference to secure storage (not inline) |
| `retentionExpiresAt` | `Timestamp` | Payload retention expiry |
| `createdAt` | `Timestamp` | Server timestamp |

### `/inventoryLedger/{entryId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `sku` | `string` | Internal variant SKU |
| `source` | `string` | `website` / `amazon_in` / `flipkart_in` / `manual` |
| `type` | `string` | `reservation` / `deduction` / `release` / `adjustment` / `return_sellable` / `return_damaged` |
| `quantity` | `number` | Signed quantity change |
| `channel` | `string` | Originating channel |
| `relatedOrderId` | `string` | Associated order reference |
| `idempotencyKey` | `string` | Deduplication key |
| `actorUid` | `string` | UID of actor (system or admin) |
| `reason` | `string` | Human-readable reason |
| `timestamp` | `Timestamp` | Server timestamp |

### `/marketplaceSyncJobs/{jobId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `channel` | `string` | Target channel |
| `jobType` | `string` | `inventory_push` / `order_pull` / `price_push` / `listing_push` / `settlement_pull` |
| `cursorRef` | `string` | Pagination/continuation token |
| `status` | `string` | `pending` / `running` / `completed` / `failed` / `dead_letter` |
| `attempts` | `number` | Retry attempt count |
| `nextRetryAt` | `Timestamp` | Scheduled retry time |
| `lastErrorCategory` | `string` | `rate_limit` / `auth_failure` / `network` / `validation` / `unknown` |
| `correlationId` | `string` | Trace correlation ID |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `/marketplaceEvents/{eventId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `channel` | `string` | Source channel |
| `eventType` | `string` | `order_new` / `order_status` / `return` / `settlement` |
| `deduplicationKey` | `string` | Unique event deduplication key |
| `marketplaceEventRef` | `string` | Marketplace-assigned event/notification ID |
| `receivedAt` | `Timestamp` | When event was ingested |
| `processedAt` | `Timestamp` | When event was fully processed |
| `outcome` | `string` | `processed` / `duplicate_ignored` / `failed` / `manual_review` |
| `createdAt` | `Timestamp` | Server timestamp |

### `/marketplaceSettlements/{settlementId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `channel` | `string` | Source channel |
| `settlementRef` | `string` | Marketplace settlement reference |
| `orderRefs` | `array<string>` | Associated marketplace order IDs |
| `grossAmount` | `number` | Gross transaction amount |
| `marketplaceFees` | `number` | Platform commission + fees |
| `taxes` | `number` | Tax component |
| `refunds` | `number` | Refund deductions |
| `netAmount` | `number` | Net payout amount |
| `reconciliationStatus` | `string` | `pending` / `matched` / `mismatch` / `disputed` |
| `createdAt` | `Timestamp` | Server timestamp |

> [!CAUTION]
> **Security**: Marketplace OAuth access tokens, refresh tokens, and API secret keys must **never** be stored in any of these Firestore collections. Use Google Cloud Secret Manager or equivalent approved secret storage only.

---
*End of Marketplace Data Model.*
