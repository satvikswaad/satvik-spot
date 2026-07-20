# MARKETPLACE ORDER STATUS MAPPING

**Project**: Satwik Sweets and Pickels  
**Scope**: Cross-Channel Order Status Normalization Matrix  
**Date**: July 19, 2026  

---

## 1. Normalized Internal Status States

| Normalized Status | Description | Terminal? |
| :--- | :--- | :---: |
| `new` | Order received from marketplace, not yet acknowledged | No |
| `confirmed` | Order acknowledged by seller system | No |
| `ready_to_dispatch` | Packed and awaiting courier pickup | No |
| `shipped` | Handed to courier, tracking active | No |
| `delivered` | Delivery confirmed | **Yes** |
| `cancelled` | Cancelled before shipment | **Yes** |
| `return_requested` | Customer initiated return | No |
| `returned` | Return received by seller | **Yes** |
| `refund_initiated` | Refund processing started | No |
| `refunded` | Refund completed | **Yes** |
| `manual_review` | Unknown or unmapped external status | No |

---

## 2. Amazon India Status Mapping

| Amazon Order Status | Normalized Internal Status |
| :--- | :--- |
| `Pending` | `new` |
| `Unshipped` | `confirmed` |
| `PartiallyShipped` | `confirmed` (line-item level) |
| `Shipped` | `shipped` |
| `Canceled` | `cancelled` |
| `Unfulfillable` | `manual_review` |
| *(Unknown/New Value)* | `manual_review` |

---

## 3. Flipkart India Status Mapping

| Flipkart Order Status | Normalized Internal Status |
| :--- | :--- |
| `APPROVED` | `confirmed` |
| `PACKED` | `ready_to_dispatch` |
| `READY_TO_DISPATCH` | `ready_to_dispatch` |
| `SHIPPED` | `shipped` |
| `DELIVERED` | `delivered` |
| `CANCELLED` | `cancelled` |
| `RETURN_REQUESTED` | `return_requested` |
| `RETURNED` | `returned` |
| *(Unknown/New Value)* | `manual_review` |

---

## 4. Unknown Status Handling

> [!CAUTION]
> Unknown external statuses must never be guessed. They enter the `manual_review` queue. No irreversible inventory release, refund, or settlement action is triggered automatically for unrecognized statuses.

---
*End of Marketplace Order Status Mapping.*
