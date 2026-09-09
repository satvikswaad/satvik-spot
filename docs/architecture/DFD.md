# DATA FLOW DIAGRAMS (PHASE 10A — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Level 0, Level 1 & Level 2 Data Flow Diagrams (Render Backend & Firebase Staging)  
**Date**: July 20, 2026  

---

## Level 0 — Context Diagram

```mermaid
graph LR
    CUSTOMER["Customer"]
    ADMIN["Administrator"]
    SYSTEM["Satwik Spot Platform"]
    AMAZON["Amazon India"]
    FLIPKART["Flipkart India"]

    CUSTOMER -->|"Browse, Order, Review, Message"| SYSTEM
    SYSTEM -->|"Confirmation, Status, Receipt"| CUSTOMER
    ADMIN -->|"CRUD, Transitions, Moderation"| SYSTEM
    SYSTEM -->|"Dashboard, Reports, Audit"| ADMIN
    SYSTEM -.->|"Listings, Inventory, Prices (DISABLED)"| AMAZON
    AMAZON -.->|"Orders, Returns, Settlements (DISABLED)"| SYSTEM
    SYSTEM -.->|"Listings, Inventory, Prices (DISABLED)"| FLIPKART
    FLIPKART -.->|"Orders, Returns, Settlements (DISABLED)"| SYSTEM
```

---

## Level 1 — Major Process Flows

```mermaid
graph TB
    subgraph "1.0 Customer Ordering"
        P1["1.1 Browse Catalog"]
        P2["1.2 Cart Management"]
        P3["1.3 Checkout & Payment"]
        P4["1.4 Order Tracking"]
    end

    subgraph "2.0 Admin Operations"
        P5["2.1 Product & Inventory CRUD"]
        P6["2.2 Order Status Transitions"]
        P7["2.3 Message Management"]
        P8["2.4 Review Moderation"]
        P9["2.5 Audit & Dashboard"]
    end

    subgraph "3.0 Marketplace Sync (DISABLED)"
        P10["3.1 Listing Sync"]
        P11["3.2 Inventory Propagation"]
        P12["3.3 Order Import"]
        P13["3.4 Settlement Reconciliation"]
    end

    DS_PRODUCTS[("Products")]
    DS_ORDERS[("Orders")]
    DS_MESSAGES[("Messages")]
    DS_REVIEWS[("Reviews")]
    DS_INVENTORY[("Inventory Ledger")]
    DS_AUDIT[("Audit Logs")]

    P1 --> DS_PRODUCTS
    P3 --> DS_ORDERS
    P5 --> DS_PRODUCTS
    P5 --> DS_INVENTORY
    P6 --> DS_ORDERS
    P6 --> DS_AUDIT
    P7 --> DS_MESSAGES
    P8 --> DS_REVIEWS
    P9 --> DS_AUDIT
    P10 -.-> DS_PRODUCTS
    P11 -.-> DS_INVENTORY
    P12 -.-> DS_ORDERS
```

---

## Level 2 — Order Processing Detail

```mermaid
graph TB
    subgraph "1.3 Checkout & Payment (Level 2)"
        V1["1.3.1 Validate Cart Items"]
        V2["1.3.2 Verify Stock Availability"]
        V3["1.3.3 Calculate Server-Authoritative Totals"]
        V4["1.3.4 Check Idempotency Key"]
        V5["1.3.5 Execute Atomic Transaction"]
        V6["1.3.6 Generate Guest Access Secret"]
        V7["1.3.7 Write Audit Event"]
        V8["1.3.8 Return Confirmation"]
    end

    V1 --> V2 --> V3 --> V4 --> V5 --> V6 --> V7 --> V8
```

---
*End of Data Flow Diagrams.*
