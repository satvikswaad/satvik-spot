# Satvik Swaad ? Project Brain

## 1. Executive Summary & Brand Identity
- **Brand**: Satvik Swaad (?????? ?????) ? "Maa ke swaad ki virasat"
- **Core Value**: 100% Homemade, pure desi goodness, cold-pressed mustard oil, sun-cured maturity, traditional rock salt, zero artificial preservatives.
- **Audience**: Consumers seeking authentic, traditional Indian condiments, pickles, murabbas, and traditional sweets made exactly like homemade village recipes.

---

## 2. System Architecture
- **Frontend**: Static client assets served via Firebase Hosting (`public/site/`), bundled and minified to `public/site/dist/`.
- **Backend API**: Node.js 22, Express.js with TypeScript (`backend/src/`), deployed on Render (`https://satvik-spot-backend-staging.onrender.com`).
- **Database**: Google Cloud Firestore (multi-collection architecture: `products`, `orders`, `messages`, `reviews`, `customers`, `audit_logs`).
- **Authentication**: Firebase Authentication (Google OAuth + Email/Password + TOTP MFA for Admin Portal).
- **Payment Processing**: Dual-channel:
  1. Razorpay Payment Gateway integration (card, UPI, net banking) with signature verification.
  2. WhatsApp-assisted ordering with client-side message prefilling and backend order recording.

---

## 3. Client State & Storage Contracts
| Key | Storage Type | Payload Schema | Purpose |
|---|---|---|---|
| `satwikCart_v2` | `localStorage` | `Array<{ id, name, variant, price, qty, img, mrp }>` | Persists active shopping cart items |
| `satwikRecentOrders_v1` | `localStorage` | `Array<string>` | Stores order IDs placed from this device for quick lookup |
| `satwikUserPreferences_v1` | `localStorage` | `{ lang?: string, lastVisited?: number }` | Stores user interface preferences |

---

## 4. Invariant DOM Contracts (Critical Selectors)
The client-side JavaScript (`script.js`) binds to specific DOM selectors that MUST be preserved across all HTML revisions:
- **Cart Selectors**: `#cart-count-badge`, `#header-cart-count`, `#bottom-cart-count-badge`, `.cart-badge`, `#cart-items-container`, `#cart-total-display`, `#btn-open-cart`, `#btn-close-cart`, `#cart-drawer-overlay`
- **Checkout Modal**: `#checkout-modal`, `#checkout-form`, `#btn-submit-order`, all `#co-*` fields
- **Product Catalog**: `.product-card[data-product-id]`, `.product-title`, `.product-hindi-title`, `.product-img`, `.btn-add-cart`, `.btn-view-details`, `.price-val`
- **Search & Sort**: `#search-input`, `#sort-select`, `.category-tab[data-category]`
- **Profile & Auth**: `#btn-google-signin`, `#btn-google-signout`, `#form-profile-details`, `#form-address-details`, `#profile-orders-list`
- **Help Assistant Widget**: `#satvik-agent-widget`, `#satvik-agent-trigger`, `#satvik-agent-card`
- **Status & Feedback**: `#toast`

---

## 5. Security Posture & Standards
- Strict Content-Security-Policy (CSP) headers with per-request cryptographic nonces.
- CORS whitelist strictly bound to authorized staging and production domain origins.
- Per-route sliding window rate limiting via Firestore tracking:
  - Orders: 5 requests / min
  - Contact Messages: 5 requests / min
  - Customer Reviews: 10 requests / min
  - Admin Mutations: 30 requests / min
- Zero evaluation or dynamic code execution: `eval()`, `new Function()`, and `document.write()` are strictly banned and enforced via automated static analysis.
- Deployment preflight checks verify zero staging credentials or admin bypass strings in production bundles.
