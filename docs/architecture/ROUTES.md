# Satvik Swaad ? Route Catalog

## 1. Storefront Static HTML Pages (Firebase Hosting)
| URL Path | Physical File | Purpose |
|---|---|---|
| `/` or `/index.html` | `public/site/index.html` | Homepage, Hero Slider, Why Choose, Catalog, Comparison Table |
| `/products.html` | `public/site/products.html` | 15-Product Catalog, Category & Price Filters, Search, Sort |
| `/product-details.html?id=:id` | `public/site/product-details.html` | Dynamic Product Detail View, Variant Selector, Reviews |
| `/our-story.html` | `public/site/our-story.html` | Heritage story, village roots, traditional values |
| `/why-us.html` | `public/site/why-us.html` | Purity pillars, lab audit notice, legal comparison |
| `/reviews.html` | `public/site/reviews.html` | Customer reviews, ratings, dynamic submission modal |
| `/faq.html` | `public/site/faq.html` | Categorized interactive FAQ accordion |
| `/contact.html` | `public/site/contact.html` | Contact details, office hours, message submission form |
| `/profile.html` | `public/site/profile.html` | Customer account dashboard, order history, address book |
| `/privacy-policy.html` | `public/site/privacy-policy.html` | Data privacy, cookies, statutory compliance |
| `/terms-and-conditions.html` | `public/site/terms-and-conditions.html` | Commercial terms, sale conditions, dispute jurisdiction |
| `/shipping-delivery-policy.html` | `public/site/shipping-delivery-policy.html` | Transit timelines, carrier policies, dispatch standards |
| `/cancellation-refund-policy.html` | `public/site/cancellation-refund-policy.html` | Returns, damaged jar replacements, refund timelines |

---

## 2. Express Backend API Routes (Render Service)
Base URL: `https://satvik-spot-backend-staging.onrender.com/api/v1`

### Products
- `GET /products`: List all active catalog products.
- `GET /products/:id`: Get full details, variants, and inventory status for a product.

### Orders & Checkout
- `POST /orders/create`: Create automated Razorpay payment order with idempotency key.
- `POST /orders/create-whatsapp-request`: Record WhatsApp-assisted order draft.
- `POST /orders/submit-utr`: Submit bank UTR for manual UPI transfer verification.
- `POST /orders/guest-lookup`: Lookup order status using orderId and guest access secret.

### Reviews & Messages
- `GET /reviews`: Fetch verified customer reviews (approved only).
- `POST /reviews`: Submit a customer review (queued for moderation).
- `POST /messages`: Submit a contact message.

### Customer Account
- `GET /customer/profile`: Get authenticated customer profile.
- `PUT /customer/profile`: Update profile info.
- `GET /customer/addresses`: List saved delivery addresses.
- `POST /customer/addresses`: Add new delivery address.
- `DELETE /customer/addresses/:id`: Delete saved address.

### Admin Portal (`/api/v1/admin/*` ? Requires TOTP MFA & Role Claims)
- Products: `POST /admin/products`, `PUT /admin/products/:id/stock`, `PUT /admin/products/:id/variants`
- Orders: `GET /admin/orders`, `PUT /admin/orders/:id/status`
- Payments: `PUT /admin/payments/verify`
- Audit: `GET /admin/audit-logs`
