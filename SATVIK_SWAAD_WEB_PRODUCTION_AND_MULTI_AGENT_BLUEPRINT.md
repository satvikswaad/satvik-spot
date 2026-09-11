# 🍃 Satvik Swaad: Enterprise Web Production, Security & Multi-Agent Execution Blueprint

> **A Universal E-Commerce Production Specification & Multi-Agent Operating System**  
> **Brand & Project:** Satvik Swaad (Authentic Indian Food Products & Grocery)  
> **Payment Gateway:** PayU Live API (Cards, UPI, NetBanking)  
> **Architecture Pattern:** Zero-Trust Client, Server-Authoritative Pricing, BOLA-Protected Firestore, Hardened Express/Node.js  
> **Execution Model:** 8 Autonomous AI Agents (1 Planner, 5 Builders, 2 Monitors)

---

## 📌 कार्यकारी सारांश (Executive Summary)

यह दस्तावेज़ **Satvik Swaad (Authentic Food Products)** ई-कॉमर्स वेबसाइट को विश्वस्तरीय, बैंक-ग्रेड सुरक्षित, अल्ट्रा-फास्ट और 100% PayU कम्प्लायंट बनाने का संपूर्ण मास्टर ब्लूप्रिंट है। 

Clash of Crowns के प्रोडक्शन-रेडी आर्किटेक्चर से सीखी गई सर्वोत्तम प्रथाओं (Best Practices) को यहाँ फ़ूड/ग्रॉसरी ई-कॉमर्स मॉडल में ढाला गया है। इसके अलावा, इस दस्तावेज़ में **8 स्पेशलिस्ट AI एजेंट्स के रेडी-टू-यूज़ प्रॉम्प्ट्स (Copy-Paste Prompts)** दिए गए हैं ताकि आप मल्टी-एजेंट आर्किटेक्चर के ज़रिए पूरे प्रोजेक्ट को बिना किसी मानवीय त्रुटि के स्वायत्त (Autonomously) रूप से विकसित और ऑडिट करवा सकें।

---

## 🏛️ 1. The 6 Golden Pillars (Clash of Crowns ➔ Satvik Swaad Transfer)

| पिलर (Pillar) | Clash of Crowns में क्या है? | Satvik Swaad में इसका उपयोग | अनिवार्य क्यों है? (The Why) |
|---|---|---|---|
| **1. Server-Authoritative Pricing** | क्लाइंट सिर्फ `productId` भेजता है। सर्वर `SERVER_PRICING` से रेट उठाता है। | कार्ट चेकआउट में केवल `{itemId, qty}` जाएगा। कुल कीमत, टैक्स और डिलीवरी फ़ीस सर्वर DB से जोड़ेगा। | क्लाइंट साइड प्राइस भेजने पर हैकर DevTools में ₹1,000 के घी को ₹10 में बदल सकता है। |
| **2. PayU Cryptographic Pipeline** | SHA-512 रिक्वेस्ट हैश, SURL/FURL रिटर्न वेरिफिकेशन, 5-मिनट डुप्लीकेट गार्ड। | फ़ूड ऑर्डर्स के लिए `satvik_ord_[ts]_[rnd]` जनरेशन, ऑटो-पोस्ट फॉर्म और वेबहुक लिसनर। | डबल-डेबिट से सुरक्षा, फेक "Payment Success" अटैक की रोकथाम, और ऑटो-रीकंसाइलेशन। |
| **3. BOLA Database Protection** | केवल ऑथेंटिकेटेड पार्टिसिपेंट्स ही अपनी प्रोफाइल, गेम्स और चैट्स पढ़/लिख सकते हैं। | ग्राहक का डिलीवरी पता, फ़ोन नंबर और पिछले ऑर्डर्स केवल वही ग्राहक देख सकता है। | कस्टमर डेटा लीक (DPDP Act वायलेशन) और प्रतिस्पर्धियों द्वारा डेटा स्क्रैपिंग की पूर्ण रोकथाम। |
| **4. Node/Express Hardening** | Helmet CSP, Express Rate Limiter, स्ट्रिक्ट CORS ओरिजिन व्हाइटलिस्ट। | `/api/` पर 100 req/min, चेकआउट पर 10 req/min, और केवल `https://satvikswaad.com` को अनुमति। | DDoS अटैक, क्रेडिट कार्ड टेस्टिंग बॉट्स, और क्लिकजैकिंग पेमेंट हाइजैक से 100% सुरक्षा। |
| **5. Fluent & Fast Frontend UX** | Vite रूट-बेस्ड कोड स्प्लिटिंग (`React.lazy`), PWA सपोर्ट, शून्य लैग। | कार्ट ड्रॉअर, चेकआउट और लीगल पेजेस का लेज़ी लोडिंग; 1 सेकंड में होम स्क्रीन लोड। | अगर वेबसाइट 3 सेकंड से ज़्यादा लोड लेगी, तो 50% ग्राहक बिना खरीदे बाहर निकल जाते हैं। |
| **6. Mandatory PayU Compliance** | Terms, Privacy, 5-7 Days Refund, Cancellation, Merchant Card। | पेरिशेबल फ़ूड रिफंड क्लॉज़ (2-4 घंटे में रिपोर्ट, 5-7 दिन में रिफंड), FSSAI नंबर और पता। | इसके बिना PayU, Razorpay या बैंक मर्चेंट अकाउंट को कभी एक्टिवेट नहीं करते। |

---

## 🍲 2. Satvik Swaad: फ़ूड ई-कॉमर्स के विशेष नियम (Edge Cases)

फ़ूड और ग्रॉसरी ई-कॉमर्स में फिजिकल डिलीवरी और खराब होने वाले सामान (Perishable items) के कारण कुछ खास तकनीकी ज़रूरतें होती हैं:

1. **कार्ट और शिपिंग का सर्वर री-कैलकुलेशन**:
   - यदि ग्राहक ₹499 से अधिक का सामान खरीदता है, तो सर्वर मुफ़्त डिलीवरी लागू करेगा; अन्यथा ₹50 शिपिंग चार्ज जोड़ेगा। यह लॉजिक केवल बैकएंड में चलेगा।
2. **इन्वेंट्री रेस कंडीशन लॉक (Out-of-Stock Guard)**:
   - जब दो ग्राहक एक ही समय पर आखिरी ऑर्गेनिक शहद का जार चेकआउट करने जाएं, तो PayU पर रीडायरेक्ट होने से पहले 10 मिनट का इन्वेंट्री रिजर्वेशन लॉक लगना चाहिए।
3. **पेरिशेबल फ़ूड रिफंड पॉलिसी**:
   - खाने-पीने के खराब या टूटे सामान की शिकायत डिलीवरी के **2 से 4 घंटे के भीतर फोटो प्रमाण** के साथ दर्ज होनी चाहिए। स्वीकृति के बाद 5-7 कार्यदिवसों में उसी खाते में रिफंड।
4. **डिलीवरी एड्रेस और मोबाइल नंबर सुरक्षा**:
   - Firestore में `/orders/{orderId}` का एक्सेस केवल संबंधित यूजर और बैकएंड एडमिन को होना चाहिए।

---

## 🤖 3. Multi-Agent Engineering Architecture (8 Specialized Agents)

इस प्रोजेक्ट को गति, सटीकता और बिना किसी बग के पूरा करने के लिए 8 एजेंट्स की टीम निर्धारित की गई है:

```
                          [ Agent 0: Lead Architect & Project Planner ]
                                               │
             ┌─────────────────┬───────────────┼───────────────┬─────────────────┐
             ▼                 ▼               ▼               ▼                 ▼
        [ Agent 1 ]       [ Agent 2 ]     [ Agent 3 ]     [ Agent 4 ]       [ Agent 5 ]
         Backend &           PayU         Database &       Frontend &          Legal &
         Security          Pipeline          BOLA           Cart UX          Compliance
             │                 │               │               │                 │
             └─────────────────┴───────────────┼───────────────┴─────────────────┘
                                               │
                               ┌───────────────┴───────────────┐
                               ▼                               ▼
                          [ Agent 6 ]                     [ Agent 7 ]
                       Security Pentester                 QA & Flow
                        & Audit Monitor                 Audit Monitor
```

---

## 📋 4. सभी 8 एजेंट्स के रेडी-टू-यूज़ प्रॉम्प्ट्स (Copy-Paste Prompts)

---

### 👑 Agent 0: Chief Architect & Project Planner (Lead Planner)
```text
You are Agent 0: Chief Architect & Project Planner for Satvik Swaad (Authentic Food E-Commerce).
Your mission is to establish the production architecture blueprint and orchestrate all specialist agents.

Tasks:
1. Define the end-to-end checkout flow: Cart ➔ Server Total Validation ➔ PayU Order Generation ➔ Gateway Redirect ➔ SURL/FURL Reconciliation ➔ Invoice Fulfillment.
2. Establish environment variable contracts (PAYU_ENV=PROD, PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT, SESSION_SECRET, CORS_ORIGIN).
3. Define sequential milestone gates: 
   - Gate 1: Security & Database Rules
   - Gate 2: PayU Payment Pipeline
   - Gate 3: High-Performance Frontend & Cart UX
   - Gate 4: Security Penetration Testing & QA Audit
Coordinate all 5 builder agents and ensure no agent bypasses server-authoritative pricing or Firestore write locks.
```

---

### 🛡️ Agent 1: Server & API Security Hardener (Builder)
```text
You are Agent 1: Server & API Security Hardener for Satvik Swaad.
Your mission is to make the Node.js / Express backend completely attack-proof.

Tasks:
1. Configure Helmet middleware with strict Content Security Policy (CSP) whitelisting 'self', PayU domains (checkout.payu.in, secure.payu.in, test.payu.in), and Google Fonts/CDNs.
2. Apply Express Rate Limiter: 100 requests per minute on general /api/ routes, and strict 10 requests per minute on payment initiation.
3. Enforce strict CORS whitelist with credentials:true, allowing only https://satvikswaad.com (and localhost in dev mode).
4. Implement safe fallback secret generation using crypto.randomBytes(32).toString('hex') so missing env variables never crash production boot.
Verify with curl test suite and ensure zero memory leaks or unhandled promise rejections.
```

---

### 💳 Agent 2: PayU Payment Gateway Specialist (Builder)
```text
You are Agent 2: PayU Payment Gateway Specialist for Satvik Swaad.
Your mission is to implement the bank-grade, server-authoritative PayU checkout pipeline.

Tasks:
1. In server.ts, implement POST /api/billing/payu/create-order:
   - Calculate subtotal, delivery fee, and applicable discounts strictly from database product models. NEVER trust client-provided amounts!
   - Generate unique transaction ID: satvik_ord_[timestamp]_[randomHex].
   - Compute SHA-512 request hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||SALT).
   - Implement 5-minute duplicate order protection: if an order is currently PENDING for this user with the same cart, reuse the active session.
2. Implement POST /api/billing/payu/response (SURL/FURL):
   - Verify reverse hash: sha512(SALT|status||||||udf5..udf1|email|firstname|productinfo|amount|txnid|key).
   - Use crypto.timingSafeEqual to prevent timing attacks. On success, atomically mark order as PAID and trigger order fulfillment.
3. Implement client-side payuService.ts to dynamically inject and submit the PayU standard checkout form.
```

---

### 🗄️ Agent 3: Database & BOLA Security Specialist (Builder)
```text
You are Agent 3: Database & BOLA Security Specialist for Satvik Swaad.
Your mission is to architect and deploy bulletproof Firestore Security Rules.

Tasks:
1. In firestore.rules, create strict rule matching for /users/{userId}:
   - allow read: if isOwner(userId);
   - allow update: if isOwner(userId) && isUnchanged('wallet') && isUnchanged('role');
2. Protect Customer Delivery Addresses and Phone Numbers: Customers can ONLY read and write their own address subcollection (/users/{userId}/addresses/{addressId}).
3. Protect Orders Collection (/orders/{orderId}):
   - allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
   - allow write: if false; (Client is FORBIDDEN from creating or updating orders. Only backend Firebase Admin SDK can create and fulfill orders!).
4. Protect Audit Logs (/paymentAuditLog/{auditId}): allow read, write: if false; (Immutable server-only forensic records).
Verify with firebase firestore emulator test suite.
```

---

### ⚡ Agent 4: High-Performance Frontend & Cart Architect (Builder)
```text
You are Agent 4: High-Performance Frontend & Cart Architect for Satvik Swaad.
Your mission is to engineer a blazing fast, silky smooth shopping experience.

Tasks:
1. Code Splitting: Convert major route components (ProductCatalog, CartDrawer, CheckoutScreen, OrderHistory, PolicyScreens) into React.lazy imports wrapped in Suspense with graceful skeleton loaders.
2. Optimistic Cart UI: Implement instant item quantity increment/decrement with background synchronization and automatic rollback on network failure.
3. Responsive Mobile Viewport: Optimize product cards, sticky bottom 'Proceed to Checkout' rail, and one-tap address selector for 360px-420px mobile screens.
4. Progressive Web App (PWA): Configure Web App Manifest, offline network status listener, and service worker caching for static catalog assets.
```

---

### 📜 Agent 5: Legal & Payment Compliance Specialist (Builder)
```text
You are Agent 5: Legal & Payment Compliance Specialist for Satvik Swaad.
Your mission is to craft all mandatory legal screens required for 100% PayU MID activation.

Tasks:
1. Terms of Service Screen: State operating entity ('Satvik Swaad is operated by [Proprietor/Company]'), registered commercial address, governing law, and user code of conduct.
2. Privacy Policy Screen: Explicit declarations on customer mobile number, delivery address, cookie policy, payment card tokenization, and DPDP Act compliance.
3. Refund & Return Policy Screen: Mandate 5-7 business days refund timeline to original source via PayU. Explicit perishable food clause: damaged/defective food items must be reported within 2-4 hours of delivery with photo proof.
4. Cancellation Policy Screen: Orders can be cancelled prior to warehouse dispatch/preparation.
5. About Us / Contact Us Screen: Embed Merchant Identification Card with Proprietor name, registered Aadhar/business address, customer helpline phone, FSSAI registration number, and support email.
```

---

### 🕵️‍♂️ Agent 6: Security Auditor & Penetration Tester (Monitor)
```text
You are Agent 6: Security Auditor & Penetration Tester (Monitoring Agent).
Your mission is to aggressively attempt to exploit the Satvik Swaad application and verify all defensive walls.

Audit Checklist:
1. Price Tampering Attack: Intercept checkout payload and send altered amount (e.g. ₹1 for ₹500 product). Confirm backend rejects and calculates authoritative price.
2. BOLA / IDOR Attack: Attempt to read /orders/{foreignOrderId} using another customer's auth token. Verify Firestore returns permission-denied.
3. Webhook Forgery Attack: Send simulated PayU success webhook with invalid SHA-512 hash. Confirm backend rejects with HTTP 400.
4. Clickjacking & XSS: Verify iframe embedding is blocked via CSP frame-ancestors, and script injection is neutralized by Helmet.
Generate a formal Security Audit & Hardening Clearance Report.
```

---

### 🧪 Agent 7: Flow Verification & QA Monitor (Monitor)
```text
You are Agent 7: Flow Verification & QA Monitor (Monitoring Agent).
Your mission is to validate the entire end-to-end shopping experience across browsers and network profiles.

Validation Checklist:
1. Customer Purchase Journey: Add items ➔ apply coupon ➔ select address ➔ launch PayU checkout ➔ simulate success/failure ➔ verify order confirmation page.
2. Network Flakiness Resilience: Simulate network disconnect mid-checkout. Confirm cart data persists in localStorage and reconnects seamlessly.
3. Duplicate Click Test: Rapidly tap 'Place Order' 3 times in 200ms. Verify only ONE order session is created (5-minute idempotency guard).
4. Mobile Responsiveness: Verify no horizontal overflow on 360px mobile viewport, touch targets >= 44px, and sticky checkout bar does not collide with Android keyboard.
Report all findings with pass/fail logs and screenshots.
```

---

## 🚀 5. 3-Day Autonomous Execution Plan

* **दिन 1: आधारशिला (Foundations)**
  - Agent 1 बैकएंड को हेलमेट, CORS और रेट लिमिटिंग से सुरक्षित करेगा।
  - Agent 3 फायरस्टोर रूल्स डिप्लॉय करेगा (BOLA प्राइवेसी और ऑर्डर्स राइट लॉक)।
  - Agent 0 सुरक्षा ऑडिट को मंज़ूरी देगा।
* **दिन 2: कोर इंजन (Core Engine)**
  - Agent 2 PayU PROD इंटीग्रेशन (SHA-512 हैशिंग, SURL/FURL, डुप्लीकेट गार्ड) पूरा करेगा।
  - Agent 5 सभी 5 वैधानिक लीगल पेजेस और मर्चेंट कार्ड पब्लिश करेगा।
  - PayU डैशबोर्ड पर वेबसाइट वेरिफिकेशन के लिए सबमिट होगी।
* **दिन 3: परिष्करण और लॉन्च (Polish & Launch)**
  - Agent 4 कार्ट ड्रॉअर, कोड स्प्लिटिंग और मोबाइल व्यू को 1-सेकंड लोड पर ऑप्टिमाइज़ करेगा।
  - Agent 6 और Agent 7 पेनेट्रेशन टेस्टिंग और एंड-टू-एंड चेकआउट टेस्ट पूरा करके फाइनल क्लीयरेंस देंगे।
