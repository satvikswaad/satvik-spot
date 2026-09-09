# DATA MIGRATION AND SEED GUIDE

**Project**: Satwik Sweets and Pickels  
**Scope**: Product Catalog Migration Tool & Local Seed Execution  
**Date**: July 19, 2026  

---

## 1. Local Migration Tool Architecture (`scripts/seed-products.ts`)

The product seed migration tool converts legacy storefront products into structured, validated Firestore documents inside `/products`.

### Features:
- **Stable Identifiers**: Assigns predictable IDs (`prod_mango_achar`, `prod_amla_murabba`) and unique SKUs (`SKU-ACH-001`, `SKU-MUR-001`).
- **Duplicate SKU Detection**: Throws error if duplicate SKUs are detected.
- **Dry-Run Mode**: Supports `--dry-run` to test schema validation without writing to database.
- **Production Protection**: Refuses execution against production unless `--project` is explicitly passed.

---

## 2. CLI Usage Commands

```bash
# 1. Execute Dry-Run Validation (No Database Writes)
npx ts-node scripts/seed-products.ts --dry-run

# 2. Execute Live Seed against Local Firebase Emulator
npx ts-node scripts/seed-products.ts --project satwiksweetsandpickels
```

---
*End of Data Migration and Seed Guide.*
