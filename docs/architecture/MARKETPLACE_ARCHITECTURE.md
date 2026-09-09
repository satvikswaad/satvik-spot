# MARKETPLACE ARCHITECTURE

**Project**: Satwik Sweets and Pickels  
**Scope**: Marketplace-Neutral Multi-Channel Integration Architecture  
**Date**: July 19, 2026 (Corrected: Amazon authorization model updated)  

---

## 1. Architecture Overview

```mermaid
graph TB
    subgraph "Internal Platform (Satwik Spot)"
        CATALOG["Product Catalog<br/>(Firestore /products)"]
        INVENTORY["Inventory Ledger<br/>(Firestore /inventoryLedger)"]
        ORDERS["Order Pipeline<br/>(Firestore /orders)"]
        ADMIN["Admin Dashboard<br/>(public/admin)"]
    end

    subgraph "Marketplace Abstraction Layer"
        IFACE["Marketplace Connector Interface<br/>(authorize, createListing, updateInventory,<br/>fetchOrders, reconcile, healthCheck)"]
        SYNC["Sync Job Scheduler<br/>(/marketplaceSyncJobs)"]
        EVENTS["Event Processor<br/>(/marketplaceEvents)"]
        DLQ["Dead-Letter / Manual Review Queue"]
    end

    subgraph "Channel Adapters (Feature-Gated, Disabled by Default)"
        AMAZON["Amazon SP-API Adapter<br/>(LWA OAuth 2.0)"]
        FLIPKART["Flipkart Seller API Adapter<br/>(OAuth 2.0 Bearer)"]
        FUTURE["Future Channel Adapter<br/>(Placeholder)"]
    end

    subgraph "External Marketplaces (No Live Connection)"
        AMZ_EXT["Amazon Seller Central India"]
        FK_EXT["Flipkart Seller Hub India"]
    end

    CATALOG --> IFACE
    INVENTORY --> IFACE
    IFACE --> AMAZON
    IFACE --> FLIPKART
    IFACE --> FUTURE
    AMAZON -.->|"DISABLED"| AMZ_EXT
    FLIPKART -.->|"DISABLED"| FK_EXT
    AMAZON --> EVENTS
    FLIPKART --> EVENTS
    EVENTS --> ORDERS
    EVENTS --> INVENTORY
    EVENTS --> DLQ
    SYNC --> AMAZON
    SYNC --> FLIPKART
    ADMIN --> IFACE
```

---

## 2. Key Architectural Principles

1. **Feature-Gated by Default**: Every marketplace connector is behind a disabled feature flag. Only owners may enable connectors after verified seller account authorization.
2. **Marketplace-Neutral Business Logic**: Core ordering, inventory, and pricing logic never depend directly on Amazon or Flipkart payload formats. Channel adapters translate between marketplace-specific and internal normalized models.
3. **Internal SKU as Primary Key**: Marketplace identifiers (ASIN, FSN) are stored as references but never replace internal product or variant IDs.
4. **Inventory Ledger as Source of Truth**: All stock changes (sales, reservations, returns, adjustments) flow through the internal ledger before propagating to external channels.
5. **Idempotent Event Processing**: Every marketplace event carries a deduplication key. Duplicate processing produces no side effects.
6. **Secret Isolation**: Marketplace OAuth tokens (LWA Client Secret, Refresh Tokens, Access Tokens) are stored exclusively in Secret Manager or equivalent approved secret storage. They never enter Firestore browser-readable collections, frontend bundles, server logs, or Git.

---

## 3. Connector Lifecycle States

| State | Description |
| :--- | :--- |
| `disabled` | Default. No API calls, no credential storage, UI shows "Not Connected". |
| `authorizing` | Owner has initiated self-authorization or OAuth flow. Awaiting token storage. |
| `connected` | Valid credentials stored in Secret Manager. Sync jobs may execute. |
| `suspended` | Owner or system has paused sync (e.g. during inventory audit). |
| `error` | Repeated failures exceeded threshold. Requires manual review. |
| `revoked` | Credentials invalidated. Full re-authorization required. |

---
*End of Marketplace Architecture Document.*
