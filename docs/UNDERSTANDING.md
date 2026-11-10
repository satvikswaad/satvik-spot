# Satvik Swaad — Master Specification Understanding & Comprehension Document

> **Author**: Antigravity Engineering Agent  
> **Authority**: Based strictly on `docs/SPEC.md` (SHA-256: `79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09`) and Appendix A diagrams.  
> **Status**: Phase 0 Complete — Awaiting Owner Approval & Comprehension Verification. Zero production code has been modified.

---

## 1. Rules Summarized by Section (in Own Words)

### Section 1: Purpose, Authority & Agent Guidelines
1. Always read Sections 1 and 2 first, followed by every section relevant to the assigned task, never coding from memory. (DOC-1)
2. Follow "MUST" and "MUST NOT" unconditionally; "SHOULD" must be obeyed unless an explicit ticket exemption is recorded. (DOC-2)
3. If an instruction is absent, silent, or ambiguous, halt work immediately and document the inquiry in Section 20.3 rather than guessing. (DOC-3)
4. Never weaken or bypass any security check or validation logic to make tests pass; a failing test indicates invalid implementation code. (DOC-4)
5. Explicitly state every touched or implemented rule ID in every Git commit message (e.g., `PAY-4, STATE-2`). (DOC-5)
6. Only the designated Architect role has authority to modify `docs/SPEC.md` via formal Change Requests. (DOC-6)
7. Do not claim certification or use buzzwords like "bank-grade" or "attack-proof"; target OWASP ASVS Level 2 verified by tests. (DOC-7)
8. Mark a rule as done only when fully coded, covered by an automated test, and checked off in Section 19. (DOC-8)

### Section 2: Glossary, Naming, ID Formats & Money Rules
1. Store and calculate every currency value strictly as an integer number of paise (₹1 = 100 paise); floating-point numbers for money are prohibited everywhere. (MONEY-1)
2. Append the currency unit to every financial field name (`subtotalPaise`, `shippingPaise`, `totalPaise`); unadorned names like `amount` or `price` are considered bugs. (MONEY-2)
3. Convert integer paise to rupee strings solely via a single deterministic helper `formatRupees(paise)` yielding two decimals (e.g., `"499.00"`). (MONEY-3)
4. Forward `totalPaise` directly to Razorpay as its native integer amount parameter. (MONEY-4)
5. Restrict monetary rounding exclusively to line-item tax calculations using round-half-up to the nearest paisa; all other arithmetic is integer addition/subtraction. (MONEY-5)
6. Reject any client request containing client-computed monetary amounts, subtotals, discounts, or totals with HTTP 400 Bad Request. (MONEY-6)

### Section 3: Target Architecture, Trust Boundaries & Hosting
1. Maintain three completely isolated environments: dev (local emulators), staging (test credentials), and production (restricted access). (ARCH-1)
2. Segregate the backend into two distinct Cloud Run services with isolated service accounts: Public API and Admin API. (ARCH-2)
3. Block all direct browser access to backend services using Cloudflare reverse proxy, WAF rules, and rate limits. (ARCH-3)
4. Protect the admin application and internal APIs behind Cloudflare Zero Trust / Access with multi-factor authentication. (ARCH-4)
5. Enforce Turnstile CAPTCHA verification on sensitive public endpoints (checkout, coupon apply, review submissions). (ARCH-5)
6. Enforce an origin validation gate: require an `X-Origin-Auth` shared secret header on all incoming API requests; drop direct traffic missing it. (ARCH-6)
7. Grant backend services access to Firestore exclusively via the Admin SDK with least-privilege service account IAM roles. (ARCH-7)
8. Run automated background cron jobs for reservation expiry (every 1 min), payment reconciliation (every 5 min), and invariant checks (daily at 02:00 IST). (ARCH-8)
9. Store all uploaded images exclusively in Cloudflare R2 object storage with public read via CDN and authenticated service write. (ARCH-9)
10. Ensure zero secrets are bundled into client-side JavaScript or checked into version control. (ARCH-10)

### Section 4: Order Lifecycle State Machine
1. Maintain all permitted state transitions in a single source-of-truth file `shared/stateMachine.ts`; routes must invoke `transition()`. (STATE-1)
2. Execute every state transition inside a Firestore transaction using compare-and-set semantics with automatic retry on concurrent change. (STATE-2)
3. Write an immutable, append-only event record to `orders/{id}/events` on every successful state change capturing actor, transition, and timestamp. (STATE-3)
4. Treat transitions to the exact current state as an idempotent no-op returning HTTP 200 success. (STATE-4)
5. Forbid modifications to terminal order states (`CANCELLED`, `EXPIRED`, `DELIVERED`, `RETURNED`), except for late-payment revival. (STATE-5)
6. Mandate step-up re-authentication within the past 300 seconds for privileged actions (cancellations, manual returns, refunds). (STATE-6)

### Section 5: PayU Payment Flow
1. Verify PayU integration with automated test suites matching PayU's reference test vectors and official documentation. (PAY-1)
2. Generate PayU submission hashes using SHA-512 over pipe-delimited parameters in exact canonical sequence with server-stored salt. (PAY-2)
3. Validate PayU callback and webhook reverse hashes in constant time using `crypto.timingSafeEqual`. (PAY-3)
4. Direct browser callback completions via HTTP 303 See Other redirect to the order status presentation screen. (PAY-4)
5. Process server-to-server webhook notifications asynchronously and respond immediately with HTTP 200 "OK". (PAY-5)
6. Consolidate payment settlement from browser callback, webhook, and cron reconciliation into a single idempotent `settlePayuPayment()` function. (PAY-6)
7. Reject settlement and alert the owner if the callback amount does not match stored `totalPaise` or merchant key differs. (PAY-7)
8. Permit a maximum of 3 PayU payment retry attempts per order; create fresh `txnid` entries while maintaining order link. (PAY-8)
9. Record gateway transaction identifier in `payments` collection before advancing order to `CONFIRMED`. (PAY-9)
10. Treat duplicate payment notifications for an already settled payment as idempotent successes without double crediting. (PAY-10)
11. Mark orders as `REFUND_PENDING` with reason `LATE_PAYMENT_NO_STOCK` if payment settles after reservation expiry without available inventory. (PAY-11)

### Section 6: Other Payment Channels
1. Process Razorpay checkouts via server-created Razorpay Orders with `totalPaise`. (RZP-1)
2. Verify Razorpay webhook signatures using HMAC-SHA256 over raw binary payload with constant-time comparison. (RZP-2)
3. Settle Razorpay transactions via idempotent settlement logic similar to PayU. (RZP-3)
4. Configure Razorpay payment capture to automatic capture on order verification. (RZP-4)
5. Prevent duplicate Razorpay payments using unique `razorpay_payment_id` checks. (RZP-5)
6. Gate manual UPI behind the `upiManualEnabled` feature flag, defaulting to disabled in production. (UPI-1)
7. Enforce a strict ceiling of ₹2,000 for manual UPI payments. (UPI-2)
8. Validate manual UPI UTR submissions as exactly 12 numeric digits and store them in an indexed `utrIndex` collection to prevent reuse. (UPI-3)
9. Place manual UPI orders into `PENDING_VERIFICATION` requiring admin review with step-up authentication. (UPI-4)
10. Hold inventory reservation for manual UPI orders for a maximum of 2 hours. (UPI-5)
11. Prevent customer submission of duplicate or conflicting UTRs across separate orders. (UPI-6)
12. Reject invalid or mismatched UTR submissions and log attempts for review. (UPI-7)
13. Notify customers immediately via UI upon manual UPI order approval or rejection. (UPI-8)
14. Restrict Cash on Delivery (COD) to eligible delivery pincodes and maximum order total of ₹3,000. (COD-1)
15. Verify COD customer phone numbers via OTP or call confirmation before advancing order to `CONFIRMED`. (COD-2)
16. Record `paymentStatus` as `COD_DUE` upon confirmation, transitioning to `COD_COLLECTED` upon delivery confirmation. (COD-3)
17. Hold COD inventory reservation for 30 minutes awaiting initial phone/OTP confirmation. (COD-4)
18. On COD returns, do NOT automatically return food items to saleable inventory; require admin `RESTOCK` or `WRITE_OFF` triage. (COD-5)
19. Blacklist addresses and phone numbers exhibiting repeat COD rejections using salted cryptographic hashes. (COD-6)
20. Generate server-priced order quotes for WhatsApp orders before creating a reservation. (WA-1)
21. Hold WhatsApp order inventory reservations for 2 hours while customer completes payment link. (WA-2)
22. Dispatch payment link to WhatsApp customer with server-verified amount. (WA-3)
23. Transition WhatsApp orders using standard `transition()` pipeline upon payment confirmation. (WA-4)
24. Restrict POS checkout creation to users with active `staff` or `owner` custom claims. (POS-1)
25. Deduct inventory immediately for in-person POS sales without reservation delay. (POS-2)
26. Cap staff POS discounts at the lesser of 5% and ₹100 per sale; larger discounts require owner step-up authorization. (POS-3)
27. Issue sequential financial-year tax invoices (`SS-2026-0001`) atomically for all POS transactions. (POS-4)
28. Record payment method for POS sales (`CASH` or `UPI_COUNTER`) with immediate settlement. (POS-5)
29. Perform mandatory daily cash drawer balance reconciliation against recorded cash sales. (POS-6)
30. Log every POS transaction in the immutable audit log with staff identity and terminal metadata. (POS-7)
31. Forbid deletion or in-place modification of completed POS transactions; corrections require credit note issuance. (POS-8)

### Section 7: Pricing, Delivery, Discounts & Tax
1. Accept only product variant IDs and quantities from clients; calculate all prices, discounts, delivery fees, and taxes on the server. (PRICE-1)
2. Place online orders exceeding ₹25,000 into a manual fraud and safety review hold before packing. (PRICE-2)
3. Compute delivery fees strictly by delivery pincode lookup, never by parsing city/state text fields. (PRICE-3)
4. Provide free delivery when order subtotal minus discounts is ₹499 or greater for non-local addresses. (PRICE-4)
5. Provide free local delivery for Deoria local delivery zone (pincode 274001). (PRICE-5)
6. Charge a standard ₹50 delivery fee for sub-threshold orders. (PRICE-6)
7. Issue quotes with a 15-minute validity window locking price and inventory availability. (PRICE-7)
8. Calculate GST per variant tax rate (12% for pickles/chutneys, 5% for sweets/ghee) rounded half-up to nearest paisa per line. (PRICE-8)
9. Freeze immutable line snapshots (unit price, tax rate, HSN code, title) on order document at time of creation. (PRICE-9)
10. Store discount codes in `discounts` collection with type (`PERCENT` or `FLAT_PAISE`), validity period, min spend, and usage limits. (DISC-1)
11. Enforce atomic single-use coupons via `redemptions/{code_orderId}` record inside the order creation transaction. (DISC-2)
12. Release coupon redemption record if the associated order expires or is cancelled before payment. (DISC-3)
13. Prevent stacking of multiple promotional discount codes on a single order. (DISC-4)
14. Limit failed coupon application attempts to 5 per IP/user per hour to block brute-force voucher enumeration. (DISC-5)
15. Require step-up authentication and audit logging for any product catalog price modification. (ADMINPRICE-1)
16. Require secondary confirmation if an admin modifies any product price by more than 50%. (ADMINPRICE-2)
17. Retain historical price audit trail on variant documents when catalog prices are updated. (ADMINPRICE-3)

### Section 8: Inventory, Reservations & Stock Transactions
1. Ensure inventory `onHand` never becomes negative; enforce `onHand - reserved >= requestedQty` guard in transaction. (STOCK-1)
2. Execute all inventory adjustments exclusively through the `inventory.ts` domain module; no direct DB writes. (STOCK-2)
3. Flag variants falling below the low-stock threshold (5 units) and alert the store owner. (STOCK-3)
4. Hold inventory reservations according to channel: 15 min for PayU/Razorpay, 2 hrs for manual UPI/WhatsApp, 30 min for COD. (STOCK-4)
5. Quarantine returned food products in a separate triage state until admin manually decides `RESTOCK` or `WRITE_OFF`. (STOCK-5)
6. Record an immutable ledger entry in `stockMovements` for every single stock change with before/after counts, delta, actor, and reason. (STOCK-6)
7. Maintain product batch numbers and best-before dates on stock movements to support batch traceability and food safety recalls. (STOCK-7)

### Section 9: Authentication, Authorization & Admin Access
1. Authenticate every protected API route using Firebase Authentication ID tokens with `checkRevoked = true`. (AUTH-1)
2. Enforce strict Broken Object Level Authorization (BOLA) checks: return HTTP 404 (never 403) when an order does not belong to caller. (AUTH-2)
3. Authenticate guest orders exclusively via a 32-byte cryptographically random token hashed with SHA-256 in the database. (AUTH-3)
4. Grant admin and staff roles exclusively via Firebase Custom Claims managed on the server; ignore any role field in Firestore documents. (AUTH-4)
5. Require step-up re-authentication within the past 300 seconds for sensitive admin operations (refunds, cancellations, price edits). (AUTH-5)
6. Enforce account lockout for 15 minutes following 5 consecutive failed login attempts on an account or IP. (AUTH-6)
7. Terminate admin sessions automatically after 30 minutes of inactivity. (AUTH-7)
8. Require multi-factor authentication (MFA / 2FA) for all administrative and staff user accounts. (AUTH-8)
9. Restrict registered users to a maximum of 5 saved shipping addresses in their customer profile. (AUTH-9)
10. Store user passwords and sensitive identity credentials only in managed Firebase Auth, never in application databases. (AUTH-10)

### Section 10: Security Controls
1. Strip all raw HTML tags and dangerous characters; populate DOM only using `textContent` and `createElement`, never `innerHTML`. (XSS-1)
2. Forbid `document.write`, `outerHTML`, `insertAdjacentHTML`, `eval()`, and `new Function()` across entire client codebase. (XSS-2)
3. Sanitize all dynamic attribute assignments (`href`, `src`) to prevent `javascript:` pseudoprotocol execution. (XSS-3)
4. Prepend CSV export cells starting with `=`, `+`, `-`, or `@` with a single quote to prevent spreadsheet injection attacks. (XSS-4)
5. Encode all server-reflected user inputs in API error responses and notifications. (XSS-5)
6. Enforce a strict Content Security Policy (CSP) forbidding `unsafe-inline` scripts and restricting connect/script domains. (XSS-6)
7. Set cookie flags `Secure`, `HttpOnly`, and `SameSite=Strict` on all sensitive authentication session cookies. (XSS-7)
8. Use subresource integrity (SRI) hashes on all external third-party script assets. (XSS-8)
9. Store all secrets in Google Cloud Secret Manager / Cloudflare Secrets; never in source control or environment files. (SECRETS-1)
10. Restrict secret access in Cloud Run to runtime injection without persisting secrets to container filesystems. (SECRETS-2)
11. Separate production secrets from development and staging secrets with distinct cryptographic keys. (SECRETS-3)
12. Rotate API keys and origin secrets on fixed cadences (90 days for origin auth, 180 days for payment gateways). (SECRETS-4)
13. Purge revoked secrets immediately from cache and restart backend service instances upon rotation. (SECRETS-5)
14. Perform gateway refunds exclusively via the payment gateway dashboard until the D7 automated refund decision is formally ratified. (SECRETS-6)
15. Format application and audit logs as structured JSON containing timestamp, severity, route, actor, and unique requestId. (LOG-1)
16. Mask or hash sensitive Personal Identifiable Information (PII) including phone numbers, emails, and address lines in logs. (LOG-2)
17. Maintain an append-only, SHA-256 hash-chained audit log in `audit_logs` capturing all administrative and financial mutations. (LOG-3)
18. Forbid logging of full credit card numbers, CVVs, passwords, UPI PINs, or raw encryption salts. (LOG-4)
19. Pin all npm dependency versions exactly and enforce builds via `npm ci` referencing `package-lock.json`. (DEP-1)
20. Run automated security vulnerability scans (`npm audit`) in CI/CD pipeline blocking builds on high/critical CVEs. (DEP-2)
21. Pin GitHub Actions workflows to full 40-character commit SHAs rather than mutable tags. (DEP-3)
22. Minimize third-party dependencies; prefer native Node.js standard libraries (`crypto`, `fetch`) over npm packages. (DEP-4)
23. Maintain an automated software bill of materials (SBOM) and review library updates quarterly. (DEP-5)
24. Authorize refund transactions strictly through the admin service; the public API service has zero refund privileges. (REFUND-1)
25. Record all refund requests in `refunds` collection linked to the order with reason code and actor identity. (REFUND-2)
26. Require dual-admin approval for refunds exceeding ₹2,000 or upon the third refund issued by a single admin within 24 hours. (REFUND-3)
27. Ensure cumulative refunded amount never exceeds original order `totalPaise`. (REFUND-4)
28. Transition order payment state to `PARTIALLY_REFUNDED` or `REFUNDED` based on remaining balance. (REFUND-5)

### Section 11: Database & Storage Architecture
1. Deny 100% of client-side direct reads and writes in `firestore.rules`; browsers communicate solely through backend API routes. (DB-1)
2. Attach server timestamp `updatedAt` to every write; orders additionally maintain an incrementing `version` counter. (DB-2)
3. Minimize collected personal data; never store card data or UPI PINs; store blocked COD numbers as salted hashes. (DB-3)
4. Configure Firestore Time-to-Live (TTL) policies to purge expired `quotes` and historical ephemeral records automatically. (DB-4)
5. Aggregate order metrics in real time into `stats_daily/{YYYY-MM-DD}` documents during sales transactions to prevent expensive scans. (DB-5)
6. Compute weekly, monthly, and hourly analytics summaries by aggregating daily documents rather than full collection scans. (DB-6)
7. Reconcile daily metrics via nightly batch job running at 02:00 IST and alert the owner on any variance with order ledger. (DB-7)
8. Maintain automated Point-in-Time Recovery (PITR) on the production Firestore instance. (BACKUP-1)
9. Execute automated daily database backups retained for 14 days in geographically redundant storage. (BACKUP-2)
10. Conduct quarterly disaster recovery drill by restoring a backup snapshot into staging and documenting execution duration. (BACKUP-3)
11. Commit to disaster recovery targets: Recovery Point Objective (RPO) < 24 hours (minutes with PITR), Recovery Time Objective (RTO) < 4 hours. (BACKUP-4)
12. Restrict Cloud IAM permissions so backend service accounts cannot delete backups or truncate audit buckets. (BACKUP-5)

### Section 12: Admin ERP, POS & Analytics
1. Require dual-step confirmation modal before executing destructive or irreversible admin actions. (UI-1)
2. Disable submit buttons and display spinner state immediately upon form submission to prevent double-click mutations. (UI-2)
3. Implement cursor-based pagination for high-volume collections with a default limit of 25 records per view. (UI-3)
4. Mask customer phone numbers and email addresses on admin dashboard views with click-to-reveal audit logging. (UI-4)
5. Display unambiguous visual badges indicating order status and payment status independently. (UI-5)
6. Provide an offline queue in the POS interface that syncs sales transactions atomically upon network reconnection. (UI-6)
7. Render real-time dashboard analytics exclusively from pre-aggregated summary collections (`stats_daily`). (UI-7)

### Section 13: Frontend, Image Storage & Multilingual Rules
1. Build frontend exclusively with vanilla HTML, modern CSS, and ES module JavaScript without heavy frameworks. (FE-1)
2. Forbid inline scripts (`<script>` without src) and inline event handlers (`onclick`) to comply with strict CSP. (FE-2)
3. Provide descriptive fallback text and semantic ARIA attributes for all interactive UI elements and icons. (FE-3)
4. Implement responsive mobile-first layouts supporting viewports down to 320px width without layout breakage. (FE-4)
5. Ensure forms validate inputs on the client for user experience and unconditionally re-validate on the server for security. (FE-5)
6. Display user-friendly localized error messages mapped from machine-readable backend error codes. (FE-6)
7. Implement toast notifications for transient asynchronous feedback with accessible screen-reader announcements. (FE-7)
8. Enforce total frontend bundle size budget under 150 KB for uncompressed JavaScript and CSS combined. (FE-8)
9. Comply with Core Web Vitals thresholds: Largest Contentful Paint (LCP) < 2.5s, Cumulative Layout Shift (CLS) < 0.1, INP < 200ms. (FE-9)
10. Isolate customer session state in sessionStorage and localStorage with automated cleanup upon logout. (FE-10)
11. Support modern browsers (Chrome, Firefox, Safari, Edge within last 2 major versions) without legacy polyfill bloat. (FE-11)
12. Load all UI text strings dynamically via `translations.js` using `t('key')` helper supporting English, Hindi, and Urdu. (I18N-1)
13. Set `dir="rtl"` and apply bidirectional stylesheet rules when the active language is Urdu (`ur`). (I18N-2)
14. Ensure Indian Rupee symbol (₹) is rendered consistently across all supported languages and typography. (I18N-3)
15. Format calendar dates and times according to the active locale standard with Indian Standard Time (IST) reference. (I18N-4)
16. Load appropriate web font subsets (Inter for English, Noto Sans Devanagari for Hindi, Noto Nastaliq Urdu for Urdu). (I18N-5)
17. Store localized product titles, descriptions, and ingredients in `products` documents under language subkeys (`en`, `hi`, `ur`). (I18N-6)
18. Avoid concatenating localized substrings in code; provide complete parameterized template strings. (I18N-7)
19. Persist user language preference in localStorage and update document `lang` and `dir` attributes dynamically. (I18N-8)
20. Maintain dedicated Cloudflare R2 bucket per environment; restrict write access strictly to admin backend service. (IMG-1)
21. Re-encode uploaded product images into modern WebP format at three canonical widths: 400px, 800px, and 1200px. (IMG-2)
22. Enforce a strict 5 MB file size ceiling on image uploads and validate image MIME type via binary magic bytes. (IMG-3)
23. Generate non-guessable cryptographic UUID keys for stored image assets to prevent directory traversal. (IMG-4)
24. Serve images through Cloudflare CDN with immutable cache headers (`Cache-Control: public, max-age=31536000, immutable`). (IMG-5)
25. Store customer return damage claim images in a private, non-publicly indexable R2 bucket accessible only via signed URLs. (IMG-6)
26. Delete orphaned image assets from R2 bucket when a product or variant is permanently deleted. (IMG-7)

### Section 14: Multi-Agent Operating Model
1. Confine agent work strictly to the file paths owned by the assigned role as defined in Section 14.1 table. (AGENT-1)
2. Perform all work on dedicated feature branches named `agent/<role>/<ticket-id>` branched from latest `staging`. (AGENT-2)
3. Write failing unit and integration tests before writing implementation code, demonstrating test failure first. (AGENT-3)
4. Implement code strictly according to spec requirements; do not refactor or simplify unrelated codebase sections. (AGENT-4)
5. Verify changes locally by running test suites, backend builds, and lint checks prior to pull request submission. (AGENT-5)
6. Forbid opening pull requests with failing tests or unverified security assertions. (AGENT-6)
7. Submit pull requests accompanied by the mandatory handoff template detailing verified rule IDs and test commands. (AGENT-7)
8. Run automated forbidden-pattern scans (blocking `innerHTML`, `eval`, `Math.random` for IDs, `===` on hashes). (AGENT-8)
9. Never approve or merge own pull requests; review must be performed by an independent agent or owner. (AGENT-9)
10. Never fabricate or improvise new endpoints, fields, statuses, or config keys not defined in `docs/SPEC.md`. (AGENT-10)
11. If blocked after two genuine attempts, cease modifications and submit a structured blocker report. (AGENT-11)

### Section 15: Bug Discovery, Triage & Fix Workflow
1. Write a reproduction test that fails before touching implementation code when addressing any reported bug. (BUG-1)
2. Assign bug fixes strictly to the agent role that owns the affected file path according to Section 14.1. (BUG-2)
3. Conduct a codebase sweep upon fixing a bug to verify that identical bug patterns do not exist elsewhere. (BUG-3)
4. Retain every bug reproduction test permanently in the regression test suite to prevent regressions. (BUG-4)
5. Handle S0 security vulnerabilities via expedited hotfix workflow with direct owner notification and priority merge. (BUG-5)
6. Monitor production application metrics and logs for 48 hours following any bug release before marking resolved. (BUG-6)
7. If root cause analysis identifies a specification omission, submit a Change Request to update `docs/SPEC.md` first. (BUG-7)
8. Enforce nightly invariant checks at 02:00 IST verifying:
   - Every `PAID` order has exactly one matching payment record of identical amount. (INV-1)
   - Variant `onHand` equals opening count plus net `stockMovements`, and `reserved` equals active reservations. (INV-2)
   - Every order has an intact, chronological audit event chain with valid transitions. (INV-3)
   - No negative `onHand` or `reserved` inventory counts exist anywhere in database. (INV-4)
   - Every financial-year invoice number sequence is strictly contiguous with zero gaps. (INV-5)
   - Total sales recorded in `stats_daily` equals exact sum of completed orders for that date. (INV-6)
   - Hash chain integrity of `audit_logs` is valid and unbroken from genesis to head. (INV-7)
   - Zero user records contain custom role fields in document bodies. (INV-8)
   - Every coupon redemption has a corresponding order record. (INV-9)

### Section 16: Testing, Security Test Suite & Release Gates
- Release gates require: (1) 0 failing tests in full suite, (2) 100% pass rate on Section 16.3 security attack suite, (3) zero lint or TypeScript compilation errors, (4) clean forbidden pattern scan (AGENT-8), (5) successful staging smoke test.

### Section 17: Monitoring, Incident Response & Disaster Recovery
- Automated alerts trigger when: (1) HTTP 5xx error rate exceeds 1% over 5 minutes, (2) Payment failure rate exceeds 5% over 15 minutes, (3) Database read quota approaches 80% of daily threshold, (4) Nightly invariant check detects any S0 or S1 anomaly.

### Section 18: Compliance Checklist
1. Verify GST registration threshold, HSN codes, and exact GST rates per variant with qualified accountant. (TAX-1)
2. Include mandatory seller details, GSTIN, invoice serial, customer address, HSN summary, and tax breakdown on invoices. (TAX-2)
3. Retain sales invoices and financial transaction records for a minimum of 8 financial years under GST regulations. (TAX-3)
4. Maintain separation between intra-state (CGST + SGST) and inter-state (IGST) accounting. (TAX-4)
5. Ensure GST tax rates update only at midnight boundaries with formal change logging. (TAX-5)
6. Display FSSAI license / registration number on product labels, invoices, and website footer. (FOOD-1)
7. Comply with Legal Metrology and packaged food labeling mandates (ingredients, shelf life, veg logo, net wt). (FOOD-2)
8. Maintain batch traceability and best-before tracking for every produced batch of food items. (FOOD-3)
9. Establish and document formal food recall procedure for safety incidents. (FOOD-4)
10. Prominently display legal entity name, physical operating address, contact email, phone, and Grievance Officer details. (CONS-1)
11. Publish explicit Terms of Sale, Privacy Policy, Shipping Policy, and Refund/Cancellation Policy. (CONS-2)
12. Clearly state order delivery timelines and track-and-trace capabilities prior to checkout completion. (CONS-3)
13. Acknowledge consumer grievances within 48 hours and resolve within one month. (CONS-4)
14. Honor 48-hour post-delivery damage claim window; execute approved refunds within 5 to 7 business days. (CONS-5)
15. Host Firestore database and application services in India region (`asia-south1` Mumbai) to satisfy data localization laws. (DATA-1)
16. Present concise privacy notice at collection point detailing exact purpose of personal data capture. (DATA-2)
17. Collect only strictly necessary personal information needed to fulfill and deliver the order. (DATA-3)
18. Support customer right to erasure/deletion within 30 days, while retaining statutory tax and audit records. (DATA-4)
19. Encrypt all personal data in transit using TLS 1.3 and at rest using AES-256 encryption. (DATA-5)
20. Execute formal Data Protection Agreements (DPAs) with third-party service providers (Cloudflare, PayU, Razorpay). (DATA-6)
21. Report personal data security breaches to the Data Protection Board of India within statutory timeline (6 hours). (DATA-7)
22. Ensure customer credit/debit card numbers are entered strictly on PCI-DSS certified gateway hosted pages/iframes. (PCI-1)
23. Complete and maintain annual PCI-DSS Self-Assessment Questionnaire (SAQ-A) for hosted payment gateway checkout. (PCI-2)
24. Run quarterly external vulnerability scans of store domain by PCI Approved Scanning Vendor (ASV). (PCI-3)

### Section 19: Security Review Fix Backlog
- Tracks 59 verified security fixes (F01 to F59) across all architectural components, ensuring every identified vulnerability is remediated, verified by test, and logged.

### Section 20: Open Decisions & Configuration Limits
- Tracks 10 open business decisions (D1 to D10) and establishes 13 dynamic configuration limits managed in `config` documents.

---

## 2. Complete Inventory of Rule IDs & Counts by Prefix

Total Rule Prefixes: **34**  
Total Official Specification Rules: **230**

| # | Prefix | Rule Count | Rule Range | Description / Domain |
|---|---|---|---|---|
| 1 | `DOC` | 8 | DOC-1 to DOC-8 | Documentation, authority, and agent operating guidelines |
| 2 | `MONEY` | 6 | MONEY-1 to MONEY-6 | Integer paise, formatRupees, server-side monetary rules |
| 3 | `ARCH` | 10 | ARCH-1 to ARCH-10 | Environments, Cloudflare, origin gate, Cloud Run architecture |
| 4 | `STATE` | 6 | STATE-1 to STATE-6 | State machine, transitions, compare-and-set, idempotency |
| 5 | `PAY` | 11 | PAY-1 to PAY-11 | PayU payment hash, callbacks, webhook, retry, settlement |
| 6 | `RZP` | 5 | RZP-1 to RZP-5 | Razorpay integration, HMAC verification, auto-capture |
| 7 | `UPI` | 8 | UPI-1 to UPI-8 | Manual UPI feature flag, UTR index, verification, reservation |
| 8 | `COD` | 6 | COD-1 to COD-6 | Cash on delivery thresholds, phone check, returns triage |
| 9 | `WA` | 4 | WA-1 to WA-4 | WhatsApp server-priced quotes, payment links, transitions |
| 10 | `POS` | 8 | POS-1 to POS-8 | POS counter checkout, staff claims, discounts, invoices |
| 11 | `PRICE` | 9 | PRICE-1 to PRICE-9 | Server pricing calculation, pincode shipping, tax, snapshots |
| 12 | `DISC` | 5 | DISC-1 to DISC-5 | Discount codes, atomic redemption, coupon rate limits |
| 13 | `ADMINPRICE` | 3 | ADMINPRICE-1 to ADMINPRICE-3 | Catalog price updates, step-up, 50% change confirmation |
| 14 | `STOCK` | 7 | STOCK-1 to STOCK-7 | Inventory module, reservation timeouts, stock movements |
| 15 | `AUTH` | 10 | AUTH-1 to AUTH-10 | Firebase Auth, BOLA 404, guest tokens, claims, 300s step-up |
| 16 | `XSS` | 8 | XSS-1 to XSS-8 | DOM textContent, no eval/innerHTML, CSV injection defense |
| 17 | `SECRETS` | 6 | SECRETS-1 to SECRETS-6 | Secret Manager, rotation cadences, gateway dashboard refunds |
| 18 | `LOG` | 4 | LOG-1 to LOG-4 | Structured JSON logs, PII masking, SHA-256 audit chain |
| 19 | `DEP` | 5 | DEP-1 to DEP-5 | Pinned npm dependencies, npm ci, audit, action commit SHAs |
| 20 | `DB` | 7 | DB-1 to DB-7 | Firestore rules deny-all, server timestamps, stats_daily |
| 21 | `BACKUP` | 5 | BACKUP-1 to BACKUP-5 | Point-in-time recovery, daily backups, quarterly drill, RTO/RPO |
| 22 | `UI` | 7 | UI-1 to UI-7 | Destructive modal confirms, disabled buttons, pagination |
| 23 | `FE` | 11 | FE-1 to FE-11 | Vanilla ES modules, CSP compliance, bundle budgets, vitals |
| 24 | `I18N` | 8 | I18N-1 to I18N-8 | translations.js t('key'), RTL for Urdu, Noto font sets |
| 25 | `IMG` | 7 | IMG-1 to IMG-7 | Cloudflare R2, WebP widths (400/800/1200), private claims |
| 26 | `AGENT` | 11 | AGENT-1 to AGENT-11 | Role paths, test-first, local gates, handoff template |
| 27 | `BUG` | 7 | BUG-1 to BUG-7 | Failing test reproduction, sweep, 48h monitor, root cause |
| 28 | `INV` | 9 | INV-1 to INV-9 | Nightly invariant validation suite, S0/S1 alerting |
| 29 | `REFUND` | 5 | REFUND-1 to REFUND-5 | Admin service only, step-up, secondary approval thresholds |
| 30 | `TAX` | 5 | TAX-1 to TAX-5 | GST rates per variant, invoice format, 8-year record retention |
| 31 | `FOOD` | 4 | FOOD-1 to FOOD-4 | FSSAI display, packaged food labels, batch recall tracking |
| 32 | `CONS` | 5 | CONS-1 to CONS-5 | Grievance officer, policies, 48h damage claim, 5-7d refund |
| 33 | `DATA` | 7 | DATA-1 to DATA-7 | India data hosting, notice at collection, 30-day erasure |
| 34 | `PCI` | 3 | PCI-1 to PCI-3 | Hosted payment page isolation, SAQ-A compliance, ASV scans |

---

## 3. Comprehensive Numbers, Limits, Timeouts & Sizes in the Specification

| Section | Value / Measurement | Rule / Context | Config Key / Identifier |
|---|---|---|---|
| 2.1 | 100 paise = ₹1 | MONEY-1 | Currency base integer |
| 2.1 | 2 decimal places (`"499.00"`) | MONEY-3 | `formatRupees()` standard format |
| 2.2 | 12 characters Crockford base32 | Section 2.2 | `SS-` Order ID format |
| 2.2 | 22 characters total (`ss` + 20 lowercase base32) | Section 2.2 | PayU `txnid` format |
| 2.2 | 32 random bytes, base64url | Section 2.2 / AUTH-3 | Guest order token |
| 2.3 | 2 independent status fields | Section 2.3 | `orderStatus` (8), `paymentStatus` (10) |
| 2.4 | 5 sales channels | Section 2.4 | `ONLINE`, `OFFLINE_COUNTER`, `OFFLINE_PHONE`, `OFFLINE_EVENT`, `WHATSAPP` |
| 2.4 | 6 payment methods | Section 2.4 | `PAYU`, `RAZORPAY`, `UPI_MANUAL`, `COD`, `CASH`, `UPI_COUNTER` |
| 3.1 | 3 environments | ARCH-1 | `dev` (emulators), `staging`, `prod` |
| 3.2 | 2 backend Cloud Run services | ARCH-2 | Public API service, Admin API service |
| 3.3 | 32+ random bytes | ARCH-6 / SECRETS-1 | `X-Origin-Auth` header shared secret |
| 3.3 / 10.3 | 5 requests/minute per IP | Section 10.3 | Checkout route rate limit |
| 3.3 / 10.3 | 5 requests/minute per IP | Section 10.3 | Login / auth rate limit |
| 3.3 / 10.3 | 3 requests/hour per user | Section 10.3 | Customer review submission rate limit |
| 3.3 / 10.3 | 60 requests/minute per IP | Section 10.3 | General public API rate limit |
| 3.3 / 8.5 | 1 minute | ARCH-8 / 8.5 | Stock reservation expiry background job interval |
| 3.3 / 5.3 | 5 minutes | ARCH-8 / Appendix A3 | PayU / Razorpay reconciliation background job interval |
| 3.3 / 15.2 | Daily at 02:00 IST | ARCH-8 / 15.2 | Nightly data invariant validation job |
| 4.1 / 9.2 | 300 seconds (5 minutes) | AUTH-5 / STATE-6 | Step-up re-authentication window for privileged actions |
| 4.3 | 15 minutes | Section 4.3 | Late-payment revival grace period after reservation expiry |
| 5.4 | 3 attempts | PAY-8 | Maximum PayU payment attempts allowed per order |
| 6.1 | ₹2,000 (200,000 paise) | UPI-2 / 20.2 | Maximum allowed order amount for Manual UPI (`upiMaxPaise`) |
| 6.1 | Exactly 12 numeric digits | UPI-3 | Manual UPI UTR format (`^[0-9]{12}$`) |
| 6.1 / 8.4 | 2 hours (120 minutes) | UPI-5 / 8.4 | Manual UPI stock reservation hold (`reserveSlowMinutes`) |
| 6.2 | ₹3,000 (300,000 paise) | COD-1 / 20.2 | Maximum allowed order amount for Cash on Delivery (`codMaxPaise`) |
| 6.2 / 8.4 | 30 minutes | COD-4 / 8.4 | COD phone confirmation stock reservation hold (`reserveCodMinutes`) |
| 6.3 / 8.4 | 2 hours (120 minutes) | WA-2 / 8.4 | WhatsApp order stock reservation hold (`reserveSlowMinutes`) |
| 6.4 | Lower of 5% and ₹100 (10,000 paise) | POS-3 / 20.2 | Staff POS discount ceiling (`staffDiscountPercent`, `staffDiscountMaxPaise`) |
| 7.1 | ₹25,000 (2,500,000 paise) | PRICE-2 / 20.2 | Online order high-value review hold threshold (`reviewHoldPaise`) |
| 7.2 | ₹499 (49,900 paise) after discount | 7.2 / 20.2 | Free shipping threshold for non-local orders (`freeShipPaise`) |
| 7.2 | ₹50 (5,000 paise) | 7.2 / 20.2 | Standard shipping fee (`shippingFeePaise`) |
| 7.2 | Pincode 274001 | 7.2 | Deoria local delivery zone (free local shipping) |
| 7.3 | 15 minutes | PRICE-7 | Server price quote document TTL lifetime |
| 7.3 | 5 failed attempts per IP/user per hour | DISC-5 | Discount code brute-force rate limit |
| 7.4 | 12% GST | Section 7.4 | Pickles, chutneys, packaged savory goods |
| 7.4 | 5% GST | Section 7.4 | Traditional sweets, pure desi ghee, amla murabba |
| 8.3 | 5 units | STOCK-3 / 20.2 | Low stock alert threshold (`lowStockUnits`) |
| 8.4 | 15 minutes | STOCK-4 / 8.4 / 20.2 | Online gateway checkout stock reservation hold (`reserveOnlineMinutes`) |
| 9.2 | 15 minutes lockout after 5 failed logins | AUTH-6 | Brute-force credential stuffing mitigation |
| 9.2 | 30 minutes idle timeout | AUTH-7 / 20.2 | Admin session auto-logout (`adminIdleMinutes`) |
| 9.3 | Maximum 5 saved addresses | AUTH-9 | User profile address book ceiling |
| 10.2 | 100 KB (102,400 bytes) | Section 10.2 | Maximum incoming JSON request body size |
| 10.2 | 5 MB (5,242,880 bytes) | IMG-3 | Maximum file size for image uploads |
| 10.4 | 90 days | SECRETS-4 | Origin authentication token rotation cadence |
| 10.4 | 180 days | SECRETS-4 | Payment gateway API keys & secrets rotation cadence |
| 11.3 | ~50,000 reads/day | DB-5 | Free Firestore tier read budget reference |
| 11.5 | 14 days | BACKUP-2 | Daily database backup retention period |
| 11.5 | Quarterly (every 90 days) | BACKUP-3 | Disaster recovery restoration drill interval |
| 11.5 | < 24 hours (minutes with PITR) | BACKUP-4 | Target Recovery Point Objective (RPO) |
| 11.5 | < 4 hours | BACKUP-4 | Target Recovery Time Objective (RTO) |
| 12.2 | 25 records per page | UI-3 | Cursor-based admin table pagination |
| 12.3 | > ₹2,000 (200,000 paise) OR 3rd refund / 24h | REFUND-3 / 20.2 | Dual-admin authorization threshold (`refundApprovalPaise`, `refundApprovalCount`) |
| 12.4 | > 50% price change | ADMINPRICE-2 | Admin catalog double-confirmation threshold |
| 13.2 | < 150 KB combined | FE-8 | Uncompressed JavaScript + CSS performance budget |
| 13.2 | LCP < 2.5s, CLS < 0.1, INP < 200ms | FE-9 | Core Web Vitals performance thresholds |
| 13.3 | 3 languages | I18N-1 | English (`en`), Hindi (`hi`), Urdu (`ur`) |
| 13.4 | 3 widths (400px, 800px, 1200px) | IMG-2 | Cloudflare R2 generated WebP responsive image widths |
| 15.1 | 48 hours | BUG-6 / Appendix A5 | Post-release stability monitoring window |
| 17.1 | HTTP 5xx > 1% over 5 minutes | Section 17.1 | Critical server error alert threshold |
| 17.1 | Payment failures > 5% over 15 minutes | Section 17.1 | Critical payment gateway degradation alert threshold |
| 18.1 | 8 financial years (minimum 72 months) | TAX-3 | Statutory invoice & transaction record retention under GST |
| 18.3 | 48 hours from delivery | CONS-5 / D8 | Customer damaged/defective food claim submission window |
| 18.3 | 5 to 7 business days | CONS-5 / D8 | Statutory customer refund turnaround timeframe |
| 18.4 | 30 calendar days | DATA-4 | Maximum response window for customer DPDP data erasure request |
| 18.4 | 6 hours | DATA-7 | Mandatory breach notification window to Data Protection Board of India |

---

## 4. Ambiguities, Gaps & Disagreements (Questions for Section 20.3)

During our comprehensive analysis of `docs/SPEC.md`, we identified the following distinct areas where the specification is silent, has an unresolved dependency, or where implementation specifics must be clarified by the owner/Architect before coding those modules:

1. **Question 1 (Section 20.1 Decision D1 — Payment Gateway Production Preference)**:  
   *Context*: Section 20.1 lists D1 as selecting between PayU, Razorpay, or both. The specification provides full rules for both (`PAY-1..11` and `RZP-1..5`).  
   *Question*: For Wave 3 payment implementation, should the checkout UI default to PayU as primary with Razorpay as fallback, or will both gateways be presented side-by-side on the checkout screen?
2. **Question 2 (Section 20.1 Decision D3 — SMS/OTP Verification Provider for COD)**:  
   *Context*: `COD-2` mandates phone verification before confirming COD orders. Decision D3 notes Fast2SMS, MSG91, or Firebase Phone Auth.  
   *Question*: Which SMS/OTP provider credentials will be provisioned in Secret Manager for COD verification in staging/prod?
3. **Question 3 (Section 20.1 Decision D7 — Automated vs. Manual Dashboard Refunds)**:  
   *Context*: `REFUND-1` specifies admin service calls gateway refund APIs, while `SECRETS-6` states that until D7 is decided, refunds must be executed manually by the owner in the gateway dashboard while the system records `REFUND_PENDING`.  
   *Question*: Should Wave 3 implement the automated gateway API refund integration behind a feature flag, or strictly adhere to the manual gateway dashboard protocol with `REFUND_PENDING`?
4. **Question 4 (Section 20.1 Decision D9 — Distributed Rate Limiting Store)**:  
   *Context*: Decision D9 mentions Redis (e.g., Upstash free tier) vs. Firestore counters for cross-instance rate limiting (`ARCH-3`, `10.3`).  
   *Question*: Should rate-limiting middleware in Wave 2 utilize an in-memory sliding window token bucket for single-instance/dev and Cloudflare edge WAF rules for public rate limiting, or should Upstash Redis credentials be configured?
5. **Question 5 (Section 20.1 Decision D10 — Production Custom Domains)**:  
   *Context*: The spec defines architecture around `api.<domain>`, `admin.<domain>`, `img.<domain>`, and `<domain>`.  
   *Question*: What are the exact staging and production domain hostnames to be configured in Cloudflare Pages and Cloud Run origin checks (`X-Origin-Auth`)?

---

## 5. Canonical Names of Collections, Statuses, Channels & Payment Methods

All names below are copied **verbatim** from `docs/SPEC.md` and must be preserved exactly with zero variations:

### 5.1 Firestore Collections
1. `products`
2. `products/{id}/variants` (subcollection)
3. `inventory`
4. `reservations`
5. `stockMovements`
6. `orders`
7. `orders/{id}/events` (subcollection)
8. `payments`
9. `payuTxn`
10. `utrIndex`
11. `quotes`
12. `discounts`
13. `redemptions`
14. `refunds`
15. `users`
16. `reviews`
17. `contactMessages`
18. `config`
19. `counters`
20. `audit_logs`
21. `audit_head`
22. `stats_daily`

### 5.2 Order Lifecycle Statuses (`orderStatus`)
1. `PLACED`
2. `CONFIRMED`
3. `PROCESSING`
4. `SHIPPED`
5. `DELIVERED`
6. `CANCELLED`
7. `EXPIRED`
8. `RETURNED`

### 5.3 Payment Lifecycle Statuses (`paymentStatus`)
1. `UNPAID`
2. `PENDING_VERIFICATION`
3. `PAID`
4. `FAILED`
5. `COD_DUE`
6. `COD_COLLECTED`
7. `REFUND_PENDING`
8. `PARTIALLY_REFUNDED`
9. `REFUNDED`
10. `DISPUTED`

### 5.4 Sales Channels (`channel`)
1. `ONLINE`
2. `OFFLINE_COUNTER`
3. `OFFLINE_PHONE`
4. `OFFLINE_EVENT`
5. `WHATSAPP`

### 5.5 Payment Methods (`paymentMethod`)
1. `PAYU`
2. `RAZORPAY`
3. `UPI_MANUAL`
4. `COD`
5. `CASH`
6. `UPI_COUNTER`
