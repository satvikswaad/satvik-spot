# Contract DOM Selectors Catalog (docs/selectors.md)

Per **Rule FE-2** and **Section 9.1**:
> Existing DOM IDs and classes used by `script.js` and `admin.js` stay unchanged.
> New JavaScript hooks use `data-js="name"` attributes, kept apart from CSS classes, and are listed in `docs/selectors.md`. Renaming one requires a change request.

---

## 1. Global & Storefront Contract Selectors (`public/site/script.js`)

### Navigation & Language
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#btn-lang-toggle` | ID | Desktop language toggle trigger | Frozen |
| `#mobile-lang-toggle` | ID | Mobile drawer language toggle trigger | Frozen |
| `.btn-lang-toggle` | Class | Language toggle button instances | Frozen |
| `.lang-toggle-text` | Class | Container for active language label | Frozen |
| `.main-nav .nav-link` | Class | Top-level header navigation links | Frozen |
| `.mobile-nav-drawer` | Class | Mobile slide-out drawer container | Frozen |
| `.hamburger-btn` | Class | Mobile menu open toggle | Frozen |
| `.btn-close-drawer` | Class | Mobile menu close button | Frozen |

### Cart Drawer & Persistent Mini-Cart
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#cart-drawer-overlay` | ID | Modal backdrop for cart drawer | Frozen |
| `#cart-drawer` | ID | Slide-in drawer container | Frozen |
| `#btn-close-cart` | ID | Close button for cart drawer | Frozen |
| `.cart-count` | Class | Global badge showing total cart units | Frozen |
| `.cart-items-container`| Class | Container for rendered cart row items | Frozen |
| `#cart-total-price` | ID | Subtotal rupee amount display | Frozen |
| `#btn-checkout` | ID | Button initiating modal checkout flow | Frozen |
| `[data-js="cart-drawer-open"]` | Attribute | Dedicated contract hook to open drawer | Frozen |

### Dedicated Cart Page (`public/site/cart.html`)
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#cart-page-container` | ID | Main mounting root for items & summary | Frozen |
| `#cart-items-count-badge` | ID | Header counter displaying items | Frozen |
| `#btn-clear-cart` | ID | Button to empty stored cart | Frozen |
| `#btn-proceed-to-checkout` | ID | Button to advance from cart page | Frozen |
| `.btn-qty-plus` | Class | Increment quantity button | Frozen |
| `.btn-qty-minus` | Class | Decrement quantity button | Frozen |
| `.btn-item-delete` | Class | Remove line item button | Frozen |

### Checkout Modal & Flow
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#checkout-modal` | ID | Main checkout overlay container | Frozen |
| `#checkout-form` | ID | Order submission form | Frozen |
| `#checkout-title` | ID | Accessible modal title | Frozen |
| `#btn-close-checkout-icon` | ID | Close button for checkout | Frozen |
| `#checkout-items-summary` | ID | Read-only itemized list | Frozen |
| `#checkout-subtotal` | ID | Subtotal before discounts & taxes | Frozen |
| `#checkout-total` | ID | Final authoritative payable total | Frozen |
| `input[name="payment-method"]` | Selector | Payment choice (prepaid vs COD) | Frozen |
| `[data-js="apply-discount-btn"]` | Attribute | Dedicated hook for coupon verification | Frozen |

### Product Catalog & Infinite Loop
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#product-grid-container` | ID | Main catalog product card grid | Frozen |
| `.product-card` | Class | Individual product card | Frozen |
| `.btn-add-cart` | Class | Add to cart button on cards | Frozen |
| `.btn-variant-chip` | Class | Weight/variant selection chip | Frozen |
| `#reorder-scroll-track` | ID | Infinite horizontal loop container | Frozen |
| `#products-empty-state` | ID | Dynamic zero-results fallback container | Frozen |

### Newsletter & Contact Forms
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `.footer-newsletter-form` | Class | Footer subscription forms | Frozen |
| `.footer-newsletter-input` | Class | Subscription email input | Frozen |
| `.footer-newsletter-btn` | Class | Subscription submit button | Frozen |
| `[data-js="newsletter-consent"]` | Attribute | Explicit privacy & update consent checkbox | Frozen |
| `#contact-form` | ID | Customer contact message form | Frozen |

---

## 2. Admin Dashboard Contract Selectors (`public/admin/admin.js`)

### Navigation & Views
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#view-dashboard` | ID | Dashboard KPI & activity summary view | Frozen |
| `#view-orders` | ID | Orders list & management view | Frozen |
| `#view-products` | ID | Catalog editing & inventory view | Frozen |
| `#view-offline-ledger` | ID | POS & counter register ledger | Frozen |
| `#view-analytics` | ID | BI trajectory & financial analytics | Frozen |
| `#view-reviews` | ID | Two-tier customer review moderation | Frozen |
| `.admin-nav-item` | Class | Sidebar tab switches | Frozen |

### Orders & Status Management
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#orders-table-body` | ID | Render root for orders table rows | Frozen |
| `#orders-filter-status` | ID | Dropdown status filter | Frozen |
| `[data-js="order-row"]` | Attribute | Order table row contract selector | Frozen |
| `[data-js="order-action-confirm"]` | Attribute | Transition order to CONFIRMED | Frozen |
| `[data-js="order-action-ship"]` | Attribute | Transition order to SHIPPED | Frozen |
| `[data-js="order-action-deliver"]` | Attribute | Transition order to DELIVERED | Frozen |
| `[data-js="order-action-cancel"]` | Attribute | Transition order to CANCELLED | Frozen |
| `[data-js="order-action-refund"]` | Attribute | Transition order to REFUND_PENDING | Frozen |

### POS Counter & Shift Operations
| Selector | Type | Purpose | Stability Contract |
| :--- | :--- | :--- | :--- |
| `#pos-sell-now-form` | ID | POS sale entry modal/form | Frozen |
| `[data-js="pos-start-shift"]` | Attribute | Open register float dialog | Frozen |
| `[data-js="pos-close-shift"]` | Attribute | Close register float & cash count dialog | Frozen |
| `[data-js="pos-sell-submit"]` | Attribute | Submit counter sale | Frozen |

---

## 3. Rules & Modification Policy
1. Any rename of the above selectors requires an explicit RFC and update to `docs/selectors.md`.
2. New JavaScript bindings must use `data-js="..."` to prevent unintended styling coupling.
3. Every selector referenced in test suites must map to an entry in this catalog.
