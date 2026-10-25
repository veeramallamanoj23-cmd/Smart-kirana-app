# 🚀 Smart Kirana — Official Production Launch & Operational Guide

This document is the definitive production deployment and operations manual for **Smart Kirana** (Online Grocery & General Store).

---

## 1. System Architecture & Live URLs

Smart Kirana runs on a decoupled, high-performance defense-in-depth architecture:

| Component | Technology | Local URL | Live Public URL |
| :--- | :--- | :--- | :--- |
| **Storefront & App (PWA)** | React 18, Vite, Tailwind CSS, Lucide | `http://localhost:3000` | [https://circuits-level-resume-bag.trycloudflare.com](https://circuits-level-resume-bag.trycloudflare.com) |
| **Security Engine API** | Express.js, Helmet, Rate Limiters, Crypto | `http://127.0.0.1:5000` | Proxied via `/api` |
| **Authoritative Database** | Local JSON DB (`server/data/db.json`) / Supabase | `server/data/db.json` | Persistent on server |

---

## 2. Authentication & Real Telecom SMS Gateway

Smart Kirana features **zero-trust authentication** using 6-digit cryptographic OTPs with HMAC pepper hashing, 60-second cooldown, and 3-attempt brute-force protection.

### How to Dispatch Real SMS Messages to Customer Phones:

To send real carrier SMS messages directly to Indian mobile numbers via cellular networks:

1. Sign up on [Fast2SMS](https://www.fast2sms.com) (India's leading telecom SMS service, costs ~₹0.15–₹0.20 per OTP).
2. Grab your API Key from the Fast2SMS Dev API panel.
3. Add it to your `.env` file:
   ```env
   FAST2SMS_API_KEY=your_fast2sms_api_key_here
   ```
4. Restart the server. Any OTP requested on the website will now be transmitted across Indian carrier cellular towers directly to the customer's phone!

*(If no SMS key is provided, the system operates in secure preview mode, displaying the authentic cryptographic code right in the verification window for instant login without phone carrier charges).*

---

## 3. Merchant UPI & Payment Configuration

### Store UPI QR & Apps:
Smart Kirana generates **official NPCI-compliant UPI QR codes** compatible with:
* **Google Pay**
* **PhonePe**
* **Paytm**
* **BHIM UPI**
* **CRED**

### How to Receive Money Directly into Your Bank Account:
1. Log in to the **Store Administrator Portal** (link in footer or `/admin`).
2. Navigate to **Store Settings**.
3. Under **Merchant UPI ID (VPA)**, enter your UPI handle (e.g. `yourstore@okaxis`, `yourphone@ybl`, or HDFC/ICICI merchant VPA).
4. Save settings.
5. All future QR codes and mobile UPI deep-links will route payments **directly to your bank account**!

### Cash on Delivery (COD):
* Activated by default.
* Customers select COD at checkout $\rightarrow$ order is confirmed immediately with official Order ID $\rightarrow$ inventory is locked $\rightarrow$ delivery partner collects cash or doorstep UPI.

---

## 4. Store Operations & Admin Dashboard

### Admin Access:
* **Email:** `admin@smartkirana.store`
* **Password:** `kirana2026admin` (Hashed with PBKDF2 10,000 rounds SHA-512)

### Capabilities in Admin Dashboard:
1. **Live Order Pipeline:**
   * Step orders through real fulfillment stages: `Placed` $\rightarrow$ `Accepted` $\rightarrow$ `Packing & Preparing` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Delivered`.
   * Verify customer UPI UTR transaction numbers with 1 click.
2. **Catalog & Inventory Control:**
   * Add new products with high-resolution photos, MRP, selling price, pack size, category, and stock limits.
   * Adjust stock count in real-time or mark items out-of-stock.
3. **Store & Delivery Configuration:**
   * Toggle store status (**Open** / **Closed**).
   * Configure delivery fee, minimum order value, and free delivery threshold.
   * Set store address, contact numbers, and serviceable PIN codes.
4. **Security Audit Log:**
   * Real-time audit trail of all logins, checkout events, stock adjustments, and blocked attacks.

---

## 5. Deployment Options for Public Launch

### Option A: Free Deployment with Vercel & Render
1. **Frontend (Vercel)**:
   * Connect your GitHub repository to [Vercel](https://vercel.com).
   * Framework Preset: `Vite`.
   * Set environment variable `VITE_API_URL=https://your-api.onrender.com`.
2. **Backend (Render)**:
   * Create a Web Service on [Render](https://render.com).
   * Build Command: `npm install`
   * Start Command: `node server/index.js`
   * Add environment variables (`JWT_SECRET`, `FAST2SMS_API_KEY`).

### Option B: Single-Server VPS (DigitalOcean / AWS / Linode / Hostinger)
1. Install Node.js 20 & Nginx.
2. Clone repository and run:
   ```bash
   npm install
   npm run build
   pm2 start server/index.js --name "smart-kirana-api"
   ```
3. Point Nginx to serve `dist/` and reverse proxy `/api` to `http://localhost:5000`.
4. Run `certbot --nginx -d yourdomain.com` for free SSL HTTPS.

---

## 6. Regulatory & Statutory Compliance (India)

* **FSSAI Food Safety:** Displayed in footer (`FSSAI: 11224333000542`). Store owner can update to their own registered FSSAI license in Store Settings.
* **GSTIN:** Configured for Indian retail taxation.
* **Legal Policies Modal:** Terms of Sale, Privacy Policy (DPDP Act), Return & Refund Policy (24-hour fresh produce replacement), and Express Delivery Terms accessible on every page.
* **Tax Invoice:** Printable retail invoice with itemized breakdown and delivery partner fees available on the Order Tracking page.

---

© 2026 Smart Kirana Retail Private Limited. Built for enterprise performance and genuine Indian retail delivery.
