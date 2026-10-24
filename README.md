# 🛒 Smart Kirana — Online Grocery & General Store

> **Apki Apni Dukan, Superfast Delivery**  
> Modern, mobile-first online grocery and general store web application inspired by the speed and convenience of Blinkit, featuring an original brand identity, dynamic UPI QR code payments, live order tracking, and a comprehensive Store Owner Admin Dashboard.

![Smart Kirana](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

### 1. Brand Identity & Homepage
- **Original Brand Identity:** Emerald green (`#059669`), warm amber yellow (`#F59E0B`), and clean white aesthetic with modern rounded corners.
- **Top Announcement Bar:** Real-time delivery time indicator (`⚡ 15-25 Mins`), store operating hours (`7:00 AM - 11:00 PM`), and free delivery threshold.
- **Delivery Location Selector:** Check serviceability by PIN code and saved addresses (e.g., Koramangala, HSR Layout, BTM Layout).
- **Search with Live Suggestions:** Instant autocomplete by product title, brand (Amul, Tata, Aashirvaad, Britannia, Lay's, etc.), or category with category jump chips.
- **Hero Promotional Carousel:** Dynamic banners with discount codes (`WELCOME50`, `KIRANA10`, `FREEDEL`).
- **Curated Shelves:** "Today's Lightning Deals" with active countdown timer, "Bestsellers in Your Area", "Fresh Dairy & Morning Essentials", "Chilled Drinks & Evening Snacks", and "Household Cleaners & Personal Care".

### 2. Complete 9 Product Categories
Realistic sample catalog with 60+ authentic kirana items:
1. **🌾 Groceries & Staples:** Atta, Basmati Rice, Sunflower Oil, Toor Dal, Pure Ghee, Tata Salt, Refined Sugar, Garam Masala, Almonds, Suji.
2. **🥤 Cool Drinks & Beverages:** Coca-Cola, Thums Up, Sprite, Bisleri 5L, Red Bull, Real Mixed Fruit Juice, Tata Tea Gold, Nescafe Classic.
3. **🍟 Snacks & Instant Food:** Lay's Magic Masala, Haldiram's Aloo Bhujia, Maggi 2-Minute Noodles, Act II Popcorn, Kurkure, Khatta Meetha Mixture.
4. **🍪 Biscuits & Bakery:** Parle-G, Britannia Good Day Cashew, Oreo Vanilla, Toastea Rusk, Dark Fantasy Choco Fills.
5. **🍫 Chocolates & Sweets:** Dairy Milk Silk, KitKat 4 Finger, Ferrero Rocher, Haldiram's Gulab Jamun.
6. **🧼 Household & Cleaning:** Surf Excel Easy Wash, Vim Dishwash Gel, Lizol Surface Cleaner, Harpic Power Plus, Origami Tissues.
7. **🧴 Personal Care & Grooming:** Dettol Soap (Buy 4 Get 1), Colgate Strong Teeth, Head & Shoulders Cool Menthol, Parachute Coconut Hair Oil.
8. **🥛 Dairy & Daily Essentials:** Amul Taaza Toned Milk, Amul Salted Butter, Amul Fresh Paneer, Farm Fresh Brown Eggs, Modern Whole Wheat Bread.
9. **🔋 General Store & Stationery:** Duracell AA Batteries, Aim Wax Matchboxes, Classmate Pulse Notebook, Reynolds Ball Pens, Freshwrapp Aluminum Foil.

### 3. Shopping Cart & Inventory Safety
- **Strict Stock Controls:** Prevents ordering quantities greater than available store stock with warning alerts.
- **Blinkit-style Stepper:** Fast `[-] [count] [+]` increment/decrement directly from product cards or cart drawer.
- **Transparent Bill Details:** Item total, delivery partner fee, handling fee, applied coupon savings, and final payable total.
- **Free Delivery Progress Bar:** Visual progress meter encouraging customers to reach the free delivery threshold.
- **LocalStorage Persistence:** Cart state survives page reloads.

### 4. Express Checkout & Delivery Area Verification
- Validates 10-digit Indian phone numbers and complete address fields.
- **Serviceability Check:** Automatically checks if customer's delivery PIN code is within store's active service radius.
- Delivery slot selector: *Express (15-25 Mins)*, *Evening (6:00 - 8:00 PM)*, or *Tomorrow Morning (7:00 - 9:00 AM)*.
- Delivery instructions input (e.g., "Leave with guard", "Don't ring bell").

### 5. Verified UPI QR Code Payment Flow
- **NPCI Standard UPI URI:** Generates standard `upi://pay?pa=...&pn=...&am=...&tr=...` URI.
- **High-Contrast Dynamic QR Code:** Generated via `qrcode` library for smooth scanning with any UPI app (Google Pay, PhonePe, Paytm, BHIM, Cred).
- **Mobile Deep-Linking:** Direct "Open in UPI App" button for phone shoppers.
- **Strict Payment Integrity:** Follows the policy that screenshot uploads or self-confirmations do not mark orders as paid. Includes clearly marked **Demo Simulator** for testing plus integration blueprint for real gateway webhooks.

### 6. Customer Order Tracking
- Real-time pipeline with 6 clear status stages:
  1. `Order Placed`
  2. `Payment Confirmed`
  3. `Order Accepted`
  4. `Packing & Preparing`
  5. `Out for Delivery`
  6. `Delivered` (or `Cancelled`)
- Order details, itemized breakdown, and store phone hotline.
- Printable / downloadable receipt.
- Safe cancellation option before dispatch.

### 7. Store Administrator Portal (Admin Dashboard)
Protected dashboard accessible only to authenticated store administrators:
- **Demo Admin Credentials:**
  - **Email:** `admin@smartkirana.store`
  - **Password:** `kirana2026admin`
- **KPI Metrics:** Total store revenue, active in-progress orders, catalog count, low stock / sold out alerts.
- **Inventory CRUD:** Add new product, edit title/price/MRP/stock/image, delete product, quick stock adjustments (`+10`, `-5`), and active availability switch.
- **Order Pipeline Control:** Accept new orders, advance status (`Preparing` → `Out for Delivery` → `Delivered`), verify payments, or reject/cancel orders.
- **Store Settings & Delivery Zones:** Toggle store open/closed, configure operating hours, delivery fees, minimum order for free delivery, UPI merchant details, and add/remove serviceable PIN codes.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Tailwind CSS, Lucide React icons, Canvas Confetti
- **Build Tool:** Vite 5
- **Payment & QR:** QRCode generation, NPCI UPI scheme
- **Database / Backend:** Supabase client integration ready (`@supabase/supabase-js`) with automatic fallback to resilient Local-First state engine.
- **Version Control:** Git & GitHub

---

## 🚀 Quickstart & Local Development

1. **Clone or navigate to the workspace directory:**
   ```bash
   cd "New folder"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🤝 Startup Partner Collaboration

Refer to [**`COLLABORATION.md`**](file:///c:/Users/Manoj%20kumar/OneDrive/Desktop/New%20folder/COLLABORATION.md) for full instructions on:
- Sharing repository access between Developer A & Developer B
- Feature branching workflows (`git checkout -b feature/xyz`)
- Pull requests and code review checklist
- Resolving merge conflicts cleanly
- Free-tier production deployment on **Vercel** or **Netlify**
- Running [`supabase_schema.sql`](file:///c:/Users/Manoj%20kumar/OneDrive/Desktop/New%20folder/supabase_schema.sql) on Supabase.

---

## 📄 License
MIT © 2026 Smart Kirana. Built for local Indian retail digital enablement.
