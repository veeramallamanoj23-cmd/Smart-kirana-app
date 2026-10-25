# 🤖 SMART KIRANA — AI HANDOVER & ARCHITECTURE SPECIFICATION

> **Purpose of this document:** Provide complete, self-contained architectural context, code structure, data models, state flows, and setup instructions so that any AI model (ChatGPT, Claude, Cursor, Copilot, Gemini) or software engineer can immediately understand the system, refactor code, add features, and explain the codebase without missing context.

---

## 1. Project Overview & Brand Identity

- **Project Name:** Smart Kirana (Online Grocery & General Store)
- **Tagline:** *"Apki Apni Dukan, Superfast Delivery"*
- **Design Philosophy:** Inspired by the convenience and quick shopping UX of Blinkit, but with an original Indian local kirana brand identity.
- **Color Palette:**
  - Primary Green: Emerald (`#059669`, `#10B981`, `#047857`, `#ECFDF5`)
  - Secondary Yellow / Amber: Warm Gold (`#F59E0B`, `#FBBF24`, `#FEF3C7`)
  - Neutral Backgrounds: Slate 50 (`#F8FAFC`) and White (`#FFFFFF`)
  - Typography: Inter / system-ui with clean rounded corners (`rounded-2xl`, `rounded-3xl`)
- **Key Promise:** 15–25 minute express local delivery of staples, dairy, beverages, snacks, bakery, chocolates, cleaning, and personal care essentials.

---

## 2. Tech Stack & Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.453.0",
    "qrcode": "^1.5.4",
    "canvas-confetti": "^1.9.3",
    "@supabase/supabase-js": "^2.45.6"
  },
  "devDependencies": {
    "vite": "^5.4.10",
    "@vitejs/plugin-react": "^4.3.3",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
```

- **Runtime & Build:** Node.js (v20+), Vite 5, Tailwind CSS 3.
- **State Architecture:** React Context API + Resilient LocalStorage fallback + Supabase Client integration ready.
- **Payment Engine:** NPCI standard UPI URI generator + Dynamic Canvas QR Code generator (`qrcode`).

---

## 3. Directory & File Structure

```text
├── index.html                   # HTML entry point with meta tags & Inter font
├── vite.config.js               # Vite config with allowedHosts: true & port 3000
├── tailwind.config.js           # Brand colors (kirana, amber), fonts, and shadows
├── postcss.config.js            # PostCSS configuration for Tailwind
├── package.json                 # Scripts: dev, build, preview
├── supabase_schema.sql          # PostgreSQL schema, tables, RLS policies & triggers
├── COLLABORATION.md             # 2-partner Git branching, PRs, and deployment guide
├── README.md                    # Public user documentation
├── start-dev.bat                # Windows 1-click batch launcher
└── src/
    ├── main.jsx                 # Provider wrapper (Store -> Product -> Auth -> Cart -> Order -> App)
    ├── App.jsx                  # Main view router ('store', 'checkout', 'tracking', 'admin')
    ├── index.css                # Tailwind directives, custom scrollbars, animations
    ├── data/
    │   ├── categories.js        # 9 Product categories with icons, badges, colors
    │   ├── products.js          # 60+ authentic Indian kirana products with prices & stock
    │   └── initialStoreSettings.js # Operating hours, serviceable PINs, fees, UPI VPA
    ├── lib/
    │   ├── storage.js           # Safe LocalStorage serialization engine with fallback
    │   ├── supabase.js          # Supabase client initializer (auto-detects .env keys)
    │   └── upi.js               # NPCI UPI URI builder, QR generator, currency formatter
    ├── context/
    │   ├── StoreContext.jsx     # Store open/closed, serviceable PINs, fees, UPI config
    │   ├── ProductContext.jsx   # Product & category CRUD, stock auto-deduction/restore
    │   ├── AuthContext.jsx      # Customer profile, saved addresses, admin auth
    │   ├── CartContext.jsx      # Cart items, strict stock limits, totals, coupons
    │   └── OrderContext.jsx     # Order creation, 6-stage lifecycle, payment verification
    └── components/
        ├── common/
        │   ├── Navbar.jsx       # Header, brand logo, location pill, autocomplete search, cart pill
        │   ├── Footer.jsx       # Store info, customer support, policies, payment badges
        │   ├── LocationModal.jsx# Serviceable PIN code & delivery address manager
        │   ├── AuthModal.jsx    # Customer login/OTP simulator & admin sign-in
        │   └── NotificationToast.jsx # Floating toast notifications for feedback
        ├── home/
        │   ├── HeroBanner.jsx   # Promotional carousel with coupons (WELCOME50, KIRANA10)
        │   ├── CategoryPills.jsx# Scrollable category filter pills with item counts
        │   ├── DealsSection.jsx # Lightning deals with real-time countdown timer
        │   └── ProductShelf.jsx # Curated shelves (Bestsellers, Dairy, Snacks, Cleaners)
        ├── product/
        │   ├── ProductCard.jsx  # Card with delivery chip, price/MRP, discount, stock, ADD stepper
        │   ├── ProductDetailModal.jsx # Detailed modal with specs, storage, return policy
        │   └── SearchFilterBar.jsx    # Price slider, in-stock toggle, sorting selector
        ├── cart/
        │   └── CartDrawer.jsx   # Slide-over cart, free delivery meter, coupons, bill summary
        ├── checkout/
        │   ├── CheckoutPage.jsx # Contact info, address check, delivery slot, payment picker
        │   └── UpiPaymentModal.jsx # Dynamic QR code, deep-link, demo approval simulator
        ├── orders/
        │   ├── OrderTrackingPage.jsx # 6-stage status timeline, receipt print, cancel action
        │   └── OrderHistoryModal.jsx # Customer past orders list with track shortcuts
        └── admin/
            ├── AdminDashboard.jsx    # Store owner portal (KPIs, tab router)
            ├── ProductFormModal.jsx  # Add/edit product dialog with image, price, stock
            ├── AdminOrdersTab.jsx    # Order dispatcher (Accept -> Packing -> Out -> Delivered)
            └── AdminSettingsTab.jsx  # Store open/close, delivery fees, PIN code manager
```

---

## 4. Core Business Logic & State Flow

### A. Strict Inventory & Stock Management
- Each product has `stock` (integer) and `isAvailable` (boolean).
- When a customer clicks **ADD** or increments quantity:
  - `CartContext.addToCart(product, qty)` verifies `cartQuantity + qty <= product.stock`.
  - If exceeded, it triggers a warning toast (`"Only X units available in stock"`) and prevents over-ordering.
- When an order is placed:
  - `ProductContext.deductStockForOrder(order.items)` immediately reduces available units.
  - If stock hits `0`, `isAvailable` is automatically set to `false`.
- If an order is cancelled:
  - `ProductContext.restoreStockForOrder(order.items)` restores stock back to inventory.

### B. Dynamic NPCI UPI QR Payments
- Generates official NPCI payment URI:
  ```text
  upi://pay?pa={merchantUpiId}&pn={merchantName}&am={amount}&tr={orderId}&tn=Order_{orderId}&cu=INR
  ```
- Uses `qrcode` to generate an SVG/Canvas base64 Data URL rendered in high contrast.
- On mobile devices, provides a native deep link button: `<a href="upi://pay?..." target="_blank">Open in Installed UPI App</a>` (Google Pay, PhonePe, Paytm, BHIM).
- **Payment Integrity Rule:** Screenshot uploads or client clicks do not mark real orders as paid. A demo simulation button (`"Simulate Bank UPI Approval"`) is provided for testing, while the architecture provides webhooks and Supabase tables for live payment gateway verification.

### C. 6-Stage Order Lifecycle
Orders transition through the following pipeline:
1. `placed`: Order submitted by customer.
2. `payment_pending` / `payment_confirmed`: UPI payment verified or Cash on Delivery chosen.
3. `accepted`: Store owner verifies inventory and accepts order.
4. `preparing`: Store staff packs and bags items.
5. `out_for_delivery`: Delivery partner dispatched to customer's address.
6. `delivered`: Handed over at doorstep (or `cancelled` with reason).

### D. Delivery Serviceability Check
- Customer address requires a 6-digit PIN code.
- `StoreContext.isPincodeServiceable(pin)` validates against `settings.serviceablePincodes`.
- If out of radius, the checkout button is disabled and a clear error message is shown with active serviceable PIN codes.

---

## 5. Admin Portal & Credentials

- **URL Access:** Click `"Admin"` in the top navbar or footer of the application.
- **Admin Email:** `admin@smartkirana.store`
- **Admin Password:** `kirana2026admin`
- *(An auto-fill button is available in the login modal for convenience).*
- **Admin Capabilities:**
  - View real-time revenue KPIs and in-progress order counts.
  - Full Product CRUD (Add, Edit, Delete, in-place stock adjuster `+10` / `-5`).
  - Order Management (Accept, Reject, Mark Packing, Dispatch, Mark Delivered, Verify UPI Payment).
  - Store Configuration (Toggle Open/Closed, Set Delivery Fees, Free Delivery Threshold, Add/Remove Serviceable PIN codes, Configure UPI VPA).

---

## 6. Suggested Improvements for Another AI to Implement

When handing this codebase to another AI, here are high-impact enhancement prompts to assign:

1. **Live Supabase Synchronization:**
   - Connect `src/lib/supabase.js` to real Supabase tables using the provided [`supabase_schema.sql`](file:///c:/Users/Manoj%20kumar/OneDrive/Desktop/New%20folder/supabase_schema.sql).
   - Replace LocalStorage sync with Supabase Realtime subscriptions (`supabase.channel('orders')`) so order status updates appear instantly across customer and admin devices.

2. **Automated WhatsApp / SMS Order Alerts:**
   - Integrate Fast2SMS or Twilio webhooks to send automated WhatsApp/SMS notifications when order status changes to *"Out for Delivery"* or *"Delivered"*.

3. **Live GPS / Delivery Rider Tracking (Leaflet or Google Maps):**
   - Add a delivery rider view where the rider can share live coordinates and the customer can see a motorcycle icon moving along the route.

4. **Multi-Language Support (Bilingual UI):**
   - Add Hindi / English language switch (`हिन्दी` / `English`) for local kirana customer ease.

5. **Invoice PDF Generation:**
   - Add `@react-pdf/renderer` or `jspdf` to generate downloadable GST tax invoice PDFs.
