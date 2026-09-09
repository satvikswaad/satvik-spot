# MARKETPLACE RECONCILIATION PLAN

**Project**: Satwik Sweets and Pickels  
**Scope**: Inventory, Order & Settlement Reconciliation Procedures  
**Date**: July 19, 2026  

---

## 1. Reconciliation Types

### Inventory Reconciliation
- **Frequency**: Daily automated comparison; weekly manual audit.
- **Process**: Compare internal ledger `available_to_sell` per SKU against last confirmed channel quantities.
- **Mismatch Action**: Flag discrepancy, generate reconciliation report, require admin review before correction.

### Order Reconciliation
- **Frequency**: Continuous via event stream; daily batch verification.
- **Process**: Cross-reference `/marketplaceOrders` with internal `/orders`. Detect missing imports, status drift, duplicate entries.
- **Mismatch Action**: Missing orders enter manual import queue. Status drift triggers re-sync.

### Settlement Reconciliation
- **Frequency**: Per settlement cycle (weekly/bi-weekly per marketplace).
- **Process**: Match `/marketplaceSettlements` amounts against expected order-level revenue minus fees, taxes, and refunds.
- **Mismatch Action**: Flag `mismatch` status. Owner reviews before accounting finalization.

---

## 2. Import/Export Templates

All reconciliation templates follow these rules:
- **Encoding**: UTF-8 with BOM for Excel compatibility.
- **Column Names**: Stable, snake_case, versioned.
- **Formula Injection Protection**: Cell values starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with a single quote (`'`) in CSV exports.
- **Validation**: Row-level error reporting. No partial silent success.
- **Dry-Run Mode**: Import preview shows changes without committing.

---
*End of Marketplace Reconciliation Plan.*
