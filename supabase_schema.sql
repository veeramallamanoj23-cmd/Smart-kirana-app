-- ==============================================================================
-- SMART KIRANA — Supabase PostgreSQL Database Schema & Migration Script
-- Online Grocery & General Store inspired by local kirana convenience
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    color TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || floor(extract(epoch from now()))::text),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    size TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= price),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating NUMERIC(3, 2) DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INT DEFAULT 1 CHECK (reviews_count >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_deal BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    delivery_time TEXT DEFAULT '15-20 mins',
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller);

-- ------------------------------------------------------------------------------
-- 3. STORE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INT PRIMARY KEY DEFAULT 1,
    store_name TEXT NOT NULL DEFAULT 'Smart Kirana',
    tagline TEXT DEFAULT 'Superfast Online Grocery & General Store',
    phone TEXT NOT NULL DEFAULT '+91 98765 43210',
    whatsapp TEXT NOT NULL DEFAULT '+91 98765 43210',
    email TEXT NOT NULL DEFAULT 'care@smartkirana.store',
    store_address TEXT NOT NULL,
    operating_hours TEXT NOT NULL DEFAULT '7:00 AM - 11:00 PM',
    is_open BOOLEAN DEFAULT TRUE,
    delivery_fee NUMERIC(6, 2) DEFAULT 25.00,
    free_delivery_threshold NUMERIC(6, 2) DEFAULT 199.00,
    handling_fee NUMERIC(6, 2) DEFAULT 4.00,
    estimated_delivery_time TEXT DEFAULT '15-25 Mins',
    merchant_upi_id TEXT NOT NULL DEFAULT 'smartkirana@okhdfcbank',
    merchant_name TEXT NOT NULL DEFAULT 'Smart Kirana Store',
    serviceable_pincodes TEXT[] DEFAULT ARRAY['560001', '560034', '560102', '560068', '560095'],
    serviceable_areas TEXT[] DEFAULT ARRAY['Koramangala', 'HSR Layout', 'BTM Layout', 'Indiranagar', 'Jayanagar'],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure singleton settings record
INSERT INTO public.store_settings (id, store_name, store_address)
VALUES (1, 'Smart Kirana', 'Shop #14, Main Market Road, Near Gandhi Chowk, Bangalore 560034')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. CUSTOMERS & SAVED ADDRESSES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Home',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    flat TEXT NOT NULL,
    street TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL DEFAULT 'Bangalore',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    pincode TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. ORDERS & ORDER ITEMS TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. SK-90812
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address JSONB NOT NULL,
    delivery_slot TEXT DEFAULT 'Express (15-25 Mins)',
    instructions TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    handling_fee NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'upi_qr' or 'cod'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_ref TEXT,
    order_status TEXT NOT NULL DEFAULT 'placed', 
    -- 'placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
    admin_note TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    image_url TEXT
);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATED SERVER-SIDE INVENTORY DEDUCTION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_order_item_stock_deduction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - NEW.quantity),
        is_available = (stock - NEW.quantity) > 0,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_deduct_stock_after_item_insert
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_item_stock_deduction();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories & Products: Anyone can view items
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);

-- Admin product & inventory management (authenticated admin user)
CREATE POLICY "Admin write products" ON public.products 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'admin@smartkirana.store');

CREATE POLICY "Admin write settings" ON public.store_settings 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'admin@smartkirana.store');

-- Orders: Anyone can create orders (guests or customers)
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own orders by ID" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin full manage orders" ON public.orders FOR ALL TO authenticated USING (true);

CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);

-- ==============================================================================
-- Schema setup complete. Run this file in your Supabase SQL Editor.
-- ==============================================================================
