# INPUT VALIDATION MATRIX

**Project**: Satwik Sweets and Pickels  
**Scope**: Client & Server Field Validation Specifications  
**Date**: July 19, 2026  

---

## 1. Customer & Storefront Input Boundaries

| Field Name | Type | Min/Max Length | Format / Pattern | Server Validation Rule | Error Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`name`** | String | 2 – 100 chars | Unicode text (Indian names supported) | `isValidString(name, 2, 100)` | `"Customer name must be between 2 and 100 characters"` |
| **`phone`** | String | 10 – 15 chars | Digits only (`^[0-9]{10,15}$`) | `phone.replace(/\D/g, '')` | `"Phone number must contain 10 to 15 digits"` |
| **`address`** | String | 5 – 300 chars | Text, numbers, spaces, standard symbols | `isValidString(address, 5, 300)` | `"Delivery address must be between 5 and 300 characters"` |
| **`email`** | String | 5 – 100 chars | Email pattern (`^\S+@\S+\.\S+$`) | `isValidString(email, 5, 100)` | `"Invalid email format"` |
| **`items[].productId`**| String | 1 – 64 chars | Alphanumeric / slug | Catalog existence check in transaction | `"Product not found in store catalog"` |
| **`items[].qty`** | Integer | 1 – 10 items | Non-negative integer | `qty >= 1 && qty <= 10` | `"Item quantity must be between 1 and 10"` |
| **`idempotencyKey`** | String | 8 – 64 chars | `idem_[0-9a-zA-Z_]+` | Bound hash check in transaction | `"Idempotency key reused with different request payload"` |

---

## 2. Admin & Product Management Input Boundaries

| Field Name | Type | Min/Max Length | Format / Pattern | Server Validation Rule | Error Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`product.name`** | String | 2 – 100 chars | Text | `isValidString(name, 2, 100)` | `"Product name must be 2-100 characters"` |
| **`product.desc`** | String | 5 – 500 chars | Text | `isValidString(desc, 5, 500)` | `"Description must be 5-500 characters"` |
| **`product.price`** | Number | > 0 | Float / INR currency | `price > 0` | `"Price must be greater than zero"` |
| **`product.mrp`** | Number | >= price | Float / INR currency | `mrp >= price` | `"MRP must be greater than or equal to price"` |
| **`product.stock`** | Integer | >= 0 | Non-negative integer | `isNonNegativeInt(stock)` | `"Stock must be a non-negative integer"` |
| **`product.cat`** | String | Enum | `'achar' \| 'murabba' \| 'chawmpras'` | Enum match | `"Invalid category"` |

---
*End of Input Validation Matrix.*
