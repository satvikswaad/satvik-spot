# Satvik Swaad — Authoritative API Contract

> **Role**: Architect  
> **Authority**: docs/SPEC.md Sections 2, 3, 4, 5, 6, 7, 9, 10, 11, 12  
> **Status**: Frozen Contract for Wave 2 & Wave 3 Implementations

---

## 1. Global Request Standards

### 1.1 Origin Gate (`ARCH-6`)
Every request hitting the public or admin Cloud Run service must pass the origin gate header:
```http
X-Origin-Auth: <32+ byte cryptographically random shared secret>
```
Any direct request missing or with an invalid `X-Origin-Auth` header is rejected immediately with **HTTP 403 Forbidden**.

### 1.2 Content Type & Body Size (`10.2`)
- `Content-Type: application/json` required for JSON bodies.
- Maximum body size is strictly **100 KB** (`102,400 bytes`). Payloads exceeding this are rejected with **HTTP 413 Payload Too Large**.

### 1.3 Money Formatting Standard (`MONEY-1` to `MONEY-6`)
- All monetary fields in payloads are integer paise (`totalPaise`, `subtotalPaise`, `shippingPaise`, `discountPaise`, `taxPaise`).
- **Forbidden Request Fields**: Clients must NEVER send any field named `price`, `total`, `subtotal`, `shipping`, `discount`, `tax`, or variants. Doing so triggers **HTTP 400 Bad Request**.

---

## 2. Public API Endpoints (`api.<store-domain>`)

### `POST /api/quotes`
*Calculates authoritative server-side pricing, applicable discounts, delivery fee, and tax.*
- **Rate Limit**: 60 req/min per IP.
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": "mango-achar", "variantId": "mango-achar-500g", "qty": 2 }
    ],
    "pincode": "274001",
    "couponCode": "FESTIVE10"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "quoteId": "Q-7B9X4K2M8P1Q",
    "expiresAt": "2026-11-10T05:15:00.000Z",
    "lines": [
      {
        "productId": "mango-achar",
        "variantId": "mango-achar-500g",
        "title": "Sun-Cured Mango Achar",
        "qty": 2,
        "unitPricePaise": 24900,
        "lineTotalPaise": 49800,
        "taxRatePercent": 12,
        "hsn": "20019000"
      }
    ],
    "subtotalPaise": 49800,
    "discountPaise": 4980,
    "shippingPaise": 0,
    "taxPaise": 5378,
    "totalPaise": 50198
  }
  ```

---

### `POST /api/orders`
*Creates an order, reserves stock for 15 minutes, and records customer details.*
- **Rate Limit**: 5 req/min per IP.
- **Request Body**:
  ```json
  {
    "quoteId": "Q-7B9X4K2M8P1Q",
    "channel": "ONLINE",
    "paymentMethod": "PAYU",
    "customer": {
      "name": "Savitri Devi",
      "phone": "9876543210",
      "email": "savitri@example.com"
    },
    "deliveryAddress": {
      "house": "12-A",
      "street": "Civil Lines",
      "city": "Deoria",
      "state": "Uttar Pradesh",
      "pincode": "274001"
    },
    "items": [
      { "variantId": "mango-achar-500g", "qty": 2 }
    ]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "orderId": "SS-7B9X4K2M8P1Q",
    "orderStatus": "PLACED",
    "paymentStatus": "UNPAID",
    "totalPaise": 50198,
    "expiresAt": "2026-11-10T05:15:00.000Z",
    "guestToken": "vQ8z9Y2X4K1M_..."
  }
  ```

---

### `GET /api/orders/:orderId`
*Retrieves order status and tracking details.*
- **Authorization**:
  - Authenticated user: Bearer Token matching `order.userId`.
  - Guest customer: Query parameter `?token=<guestToken>`.
  - Unauthorized / Mismatched user: Returns **HTTP 404 Not Found** (`AUTH-2`).
- **Response (200 OK)**:
  ```json
  {
    "orderId": "SS-7B9X4K2M8P1Q",
    "orderStatus": "CONFIRMED",
    "paymentStatus": "PAID",
    "totalPaise": 50198,
    "createdAt": "2026-11-10T05:00:00.000Z"
  }
  ```

---

### `POST /api/payments/payu/callback`
*Browser return endpoint following PayU payment completion.*
- Validates hash in constant time.
- Settles payment via `settlePayuPayment()`.
- **Response**: **HTTP 303 See Other** redirecting to `/order-success.html?orderId=SS-...`.

---

### `POST /api/payments/payu/webhook`
*Server-to-server asynchronous IPN from PayU.*
- Validates reverse hash.
- Settles payment via `settlePayuPayment()`.
- **Response**: **HTTP 200 OK** with body `"OK"`.

---

## 3. Admin API Endpoints (`admin.<store-domain>`)

Protected behind Cloudflare Access and Firebase Auth Custom Claims (`staff` or `owner`).

### `POST /admin/orders/:orderId/transition`
*Executes order or payment status change via stateMachine.ts.*
- **Step-Up Required** (`AUTH-5`): If action is step-up (e.g., cancellations, manual returns), admin must have re-authenticated within past 300 seconds.
- **Request Body**:
  ```json
  {
    "event": "ORDER_SHIPPED",
    "reason": "Dispatched via DTDC",
    "trackingNumber": "DTDC12345678"
  }
  ```

---

### `POST /admin/pos/checkout`
*Processes in-person retail sales atomically.*
- Immediate stock deduction (`STOCK-2`).
- Sequential Financial Year Invoice generation (`SS-2026-0001`).
- Records payment as `CASH` or `UPI_COUNTER`.
