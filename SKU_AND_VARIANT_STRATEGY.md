# SKU AND VARIANT STRATEGY

**Project**: Satwik Sweets and Pickels  
**Scope**: Permanent Internal SKU Convention, Variant Architecture & Migration Plan  
**Date**: July 19, 2026  

---

## 1. Internal SKU Convention

**Format**: `SKU-{CATEGORY}-{SEQUENCE}-{WEIGHT}`

| Component | Description | Examples |
| :--- | :--- | :--- |
| `SKU` | Fixed prefix | `SKU` |
| `{CATEGORY}` | 3-letter product category code | `ACH` (Achar), `MUR` (Murabba), `CHY` (Chyawanprash), `LAD` (Ladoo) |
| `{SEQUENCE}` | 3-digit product sequence number | `001`, `002`, `003` |
| `{WEIGHT}` | Weight/size variant suffix | `250G`, `500G`, `1KG` |

**Examples**:
- `SKU-ACH-001-500G` — Traditional Aam ka Achar, 500g
- `SKU-ACH-001-1KG` — Traditional Aam ka Achar, 1kg
- `SKU-MUR-001-500G` — Organic Amla Murabba, 500g
- `SKU-CHY-001-500G` — Deshi Chyawanprash, 500g

---

## 2. Variant Data Architecture

Each product document in `/products/{productId}` contains a `variants` array:

```
variants: [
  {
    variantId: "var_ach001_500g",
    sku: "SKU-ACH-001-500G",
    weight: "500g",
    price: 249,
    mrp: 320,
    stock: 50,
    available: true,
    barcode: null  // GTIN/EAN pending external verification
  },
  {
    variantId: "var_ach001_1kg",
    sku: "SKU-ACH-001-1KG",
    weight: "1kg",
    price: 449,
    mrp: 580,
    stock: 25,
    available: true,
    barcode: null
  }
]
```

---

## 3. SKU Integrity Rules

1. **Stability**: SKU is immutable after first assignment. It is never reused even if the product is archived.
2. **Uniqueness**: Every sellable weight/size variant receives its own unique SKU.
3. **Marketplace Mapping**: Amazon `sellerSKU` and Flipkart `sellerSKU` each map back to the internal variant SKU. Marketplace identifiers (ASIN, FSN) are stored as references but never replace internal IDs.
4. **Historical Preservation**: Order item snapshots retain the variant SKU, weight, price, and product name at time of purchase. Product catalog changes never alter historical order data.
5. **Barcode/GTIN/EAN**: Exemption requirements remain externally pending until verified with each marketplace.

---

## 4. Migration from Current `weightVariant: '500g'` Model

| Step | Action | Impact |
| :--- | :--- | :--- |
| 1 | Add `variants[]` array to each product document | Non-breaking addition |
| 2 | Populate initial variant with existing `price`, `mrp`, `stock`, `weightVariant` | Data continuity |
| 3 | Assign canonical variant SKU (e.g. `SKU-ACH-001-500G`) | New field |
| 4 | Update order pipeline to reference `variantId` and variant `sku` in item snapshots | Forward-compatible |
| 5 | Preserve all existing historical order snapshots unchanged | Zero data loss |
| 6 | Add multi-variant selection UI in Phase 7+ visual polish | Deferred |

> [!IMPORTANT]
> Existing historical order item snapshots containing `weightVariant: '500g'` and the legacy flat SKU remain permanently preserved. Migration adds the variant array structure without altering past records.

---
*End of SKU and Variant Strategy.*
