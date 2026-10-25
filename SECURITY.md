# 🛡️ SMART KIRANA — ENTERPRISE SECURITY ARCHITECTURE & AUDIT REPORT

**Classification:** Confidentially Reviewed / Engineering Compliance  
**Auditor Role:** Senior Application Security Engineer  
**Status:** Defense-in-Depth Controls Enforced & Verified (14 / 14 Automated Tests Passing)  

---

## 1. Executive Summary & Security Philosophy

The **Smart Kirana** platform implements an enterprise-grade **Defense-in-Depth** security architecture. We adhere strictly to the principle of **Zero-Trust Client Input**:

> *The browser is an untrusted client environment. No security decisions, prices, discounts, stock availability, or delivery eligibility claims originating from the client are ever trusted by the server.*

All critical business logic, financial arithmetic, authentication guarantees, and authorization boundaries are enforced authoritatively on the backend (`server/index.js`) and database level (`supabase_schema.sql`).

---

## 2. Threat Model & Mitigation Matrix

| Attack Vector | Vulnerability Addressed | Defense Mechanism Enforced |
|---|---|---|
| **Price Tampering** | Client submits modified price in JSON payload | **Zero-Trust Backend Calculation:** Server looks up canonical catalog prices and recalculates subtotal and taxes. |
| **SMS Bombing / Resource Drain** | Automated script repeatedly requesting OTPs | **Multi-Tier Rate Limiting & 60s Cooldown:** Max 10 requests / 15 min per IP/phone + strict 60-second cooldown timer. |
| **OTP Brute-Forcing** | Attacker guessing 6-digit codes | **Cryptographic 6-digit OTP + 3-Attempt Lockout:** 15-minute temporary lockout after 3 failed attempts + 5-minute TTL. |
| **OTP Replay Attacks** | Reusing a previously intercepted valid code | **Immediate Invalidation:** OTP hash is deleted from cache immediately upon first successful verification. |
| **Privilege Escalation** | Customer modifying role to `admin` in token or state | **Cryptographically Signed JWT Roles:** Backend verifies `HS256` signature and rejects non-admin tokens with `403 Forbidden`. |
| **IDOR (Insecure Direct Object Reference)** | Customer inspecting or cancelling another user's order | **Owner Identity Binding:** Order endpoints compare JWT `sub` / phone against the order's owner identity before serving data. |
| **Inventory Over-ordering / Hoarding** | Client requesting more units than store holds | **Atomic Stock Check:** Backend asserts `requestedQty <= serverStock` before order confirmation. |
| **Delivery Radius Bypass** | Client ordering outside service area or manipulating coordinates | **Authoritative Haversine Calculation:** Geodesic distance computed on backend against trusted store GPS coordinates. Rejects > 10.0 km. |
| **Fake Payment Screenshots / Client Spoofing** | Client falsely claiming payment approval | **Cryptographic HMAC-SHA256 Webhook Verification:** Orders are only confirmed as paid via server-side signed webhooks with anti-replay timestamps. |
| **Order Duplication / Double Charge** | Customer rapidly tapping checkout button | **Idempotency Key Safeguard:** Backend deduplicates orders sharing identical `Idempotency-Key` within 10 minutes. |
| **Cross-Site Scripting (XSS)** | Malicious `<script>` tags in address or name fields | **Input Sanitization & CSP:** Server strips HTML tags and Helmet enforces strict `default-src 'self'`. |
| **Clickjacking** | Framing checkout in malicious iframe | **Frameguard `DENY` & CSP `frame-ancestors 'none'`.** |
| **Data Leakage in Logs** | Sensitive PII or credentials recorded in plaintext | **PII Masking:** Phones masked as `987654****`, emails masked as `r***a@...`, tokens and passwords stripped. |

---

## 3. Defense-in-Depth Architecture

```mermaid
flowchart TD
    Client[Browser / Phone Client] -->|HTTPS Request| Helmet[Helmet Security Headers\nCSP, X-Frame-Options: DENY, HSTS]
    Helmet --> CORS[Strict CORS Whitelist]
    CORS --> RateLimiter[Multi-Tier Rate Limiters\nGlobal, Auth, OTP, Checkout, Admin]
    RateLimiter --> Sanitizer[Input Sanitizer\nRegex & XSS Strip]
    Sanitizer --> Auth[JWT Token & Role Verifier]
    
    Auth --> GeoEngine[Haversine 10km Boundary Check\nStore: 12.9352, 77.6245]
    GeoEngine --> PriceEngine[Zero-Trust Pricing Engine\nAuthoritative Server Catalog]
    PriceEngine --> InvEngine[Atomic Stock Deduction & Lock]
    InvEngine --> AuditLog[(Tamper-Evident Audit Log)]
    InvEngine --> DB[(PostgreSQL with Hardened RLS)]
```

---

## 4. Key Security Modules Implemented

### A. Authentication & OTP Security (`server/security/authService.js`)
- **Genuine Randomness:** Generated using `crypto.randomInt(100000, 1000000)`. Never uses `Math.random()`.
- **In-Memory Hashing:** OTPs are HMAC-SHA256 hashed with a server pepper before storage so plaintext codes are never held in RAM.
- **Single-Use Invalidation:** OTP is purged immediately upon successful verification.
- **Session Tokens:** Issues `jsonwebtoken` signed with rotating `JWT_SECRET` (24h customer, 2h admin).

### B. Administrator Security (`server/security/authService.js`)
- **Salted PBKDF2 Password Hashing:** 10,000 rounds of SHA-512 with per-store unique salt.
- **Constant-Time Verification:** Uses `crypto.timingSafeEqual` to thwart side-channel timing attacks.
- **Strict Rate Limiting:** 5 failed attempts locks admin IP for 15 minutes.
- **Audit Logging:** Every product creation, price update, stock adjustment, and order dispatch records actor email and timestamp.

### C. Zero-Trust Pricing & Order Security (`server/security/orderService.js`)
- Client sends only: `{ items: [{ productId, quantity }], couponCode, address, paymentMethod }`.
- Server extracts canonical price from `server/data/storeState.js`.
- Client-submitted prices and totals are completely discarded.
- Rechecks stock availability under atomic transaction locks.

### D. Geodesic 10 km Radius Boundary (`server/security/geoUtils.js`)
- Store coordinates: Koramangala Hub `[12.9352, 77.6245]`.
- Calculates great-circle distance using Haversine formula:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- If distance $> 10.0$ km, order is rejected with `OUT_OF_DELIVERY_RADIUS`.

### E. Payment Webhook HMAC Verification (`server/security/orderService.js`)
- Webhook endpoints require `x-kirana-signature` and `x-kirana-timestamp`.
- Verifies HMAC-SHA256 signature using secret `PAYMENT_WEBHOOK_SECRET`.
- Rejects requests where timestamp drift exceeds 300 seconds (Anti-Replay).

---

## 5. Automated Security Audit Test Suite Results

Test script: [`tests/security_audit.js`](file:///c:/Users/Manoj%20kumar/OneDrive/Desktop/New%20folder/tests/security_audit.js)  
Command: `npm run security:audit`

| Test ID | Control & Attack Vector Tested | Test Result |
|:---:|---|:---:|
| **Test 1** | Enterprise Security Headers (`CSP`, `X-Frame-Options: DENY`, `NoSniff`) | **✅ PASS** |
| **Test 2** | Rejection of Fixed / Hardcoded OTPs without Session | **✅ PASS** |
| **Test 3** | Cryptographic OTP Generation & 60-Second Cooldown Enforcement | **✅ PASS** |
| **Test 4** | OTP Brute-Force Detection & 15-Minute Lockout after 3 Failed Attempts | **✅ PASS** |
| **Test 5** | Single-Use OTP Invalidation (Anti-Replay Defense) | **✅ PASS** |
| **Test 6** | Privilege Escalation Prevention (Customer Token rejected on Admin API) | **✅ PASS** |
| **Test 7** | IDOR Protection (Customer Cannot Cancel or Access Another Customer's Order) | **✅ PASS** |
| **Test 8** | Zero-Trust Client Pricing (Backend Discards Fake ₹1.00 Payload Price) | **✅ PASS** |
| **Test 9** | Backend 10.0 km Haversine Delivery Boundary Enforcement | **✅ PASS** |
| **Test 10** | Inventory Stock Limit Guard (Over-ordering 999 units rejected) | **✅ PASS** |
| **Test 11** | Idempotency Key Safeguard (Duplicate Order Replay Prevented) | **✅ PASS** |
| **Test 12** | Payment Webhook HMAC-SHA256 Signature Verification | **✅ PASS** |
| **Test 13** | Admin Authentication with Salted PBKDF2 Hash | **✅ PASS** |
| **Test 14** | Input Sanitization (XSS `<script>` and `<img>` Tags Stripped on Server) | **✅ PASS** |

**Final Audit Result:** **14 / 14 TESTS PASSED (100% Compliance)**

---

## 6. Audit Logging & Monitoring

Security logs are written to `server/logs/audit.log` and available to administrators in the **Security & Audit Trail** tab of the Admin Dashboard:
- Every event records `timestamp`, `action`, `actor`, `actorId`, `ip`, and sanitized `details`.
- Phone numbers and emails are masked.
- Tokens, passwords, and payment secrets are purged prior to serialization.

---

## 7. Remaining Operational Risks & Production Launch Checklist

In accordance with rule 11.10, no software is "unhackable". The following manual configurations must be finalized before public live production:

1. **SMS Gateway Credentials:** Currently, the OTP engine logs dispatched codes to the secure server console for dev testing. In production, configure Twilio or Fast2SMS API keys in `.env` (`SMS_GATEWAY_API_KEY`).
2. **Production Secrets:** Replace default development secrets in `.env`:
   - `JWT_SECRET`: Generate a random 64-character secret (`openssl rand -hex 32`).
   - `PAYMENT_WEBHOOK_SECRET`: Copy from your live payment gateway (Razorpay / Cashfree / Stripe).
3. **Database Cloud Migration:** Run [`supabase_schema.sql`](file:///c:/Users/Manoj%20kumar/OneDrive/Desktop/New%20folder/supabase_schema.sql) in your live Supabase SQL Editor to enforce database-level RLS.
4. **HTTPS Enforcement:** Always serve behind HTTPS with TLS 1.3 in production (Vercel, Cloudflare, or AWS ALB handle SSL termination automatically).
5. **Dependency Dev Notices:** The 2 moderate advisories reported by `npm audit` pertain to `esbuild` and `postcss-selector-parser` inside devDependencies (used during build compilation), which are not executed on the runtime production Node.js server.
