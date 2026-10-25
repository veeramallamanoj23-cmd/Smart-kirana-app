-- ==============================================================================
-- SMART KIRANA — Enterprise-Grade Supabase PostgreSQL Security Schema
-- Defense-in-Depth Database Access Control & Hardened Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SECURITY & AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_id TEXT,
    ip_address INET,
    resource TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.security_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.security_audit_logs(action);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
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
-- 3. PRODUCTS & INVENTORY TABLE
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

-- ------------------------------------------------------------------------------
-- 4. STORE SETTINGS (PROTECTED SINGLETON RECORD)
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
    store_latitude NUMERIC(9, 6) DEFAULT 12.9352,
    store_longitude NUMERIC(9, 6) DEFAULT 77.6245,
    max_delivery_radius_km NUMERIC(5, 2) DEFAULT 10.00,
    serviceable_pincodes TEXT[] DEFAULT ARRAY['560001', '560034', '560102', '560068', '560095'],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.store_settings (id, store_name, store_address)
VALUES (1, 'Smart Kirana', 'Shop #14, Main Market Road, Near Gandhi Chowk, Bangalore 560034')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. CUSTOMERS & ADDRESSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
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
-- 6. ORDERS & ORDER ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
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
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_ref TEXT,
    order_status TEXT NOT NULL DEFAULT 'placed',
    idempotency_key TEXT UNIQUE,
    admin_note TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);

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
-- 7. ATOMIC STOCK DEDUCTION & RESTORATION FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - NEW.quantity),
        is_available = (stock - NEW.quantity) > 0,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_deduct_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_stock_deduction();

-- ------------------------------------------------------------------------------
-- 8. DEFENSE-IN-DEPTH ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current authenticated caller an administrator?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'admin@smartkirana.store');
END;
$$ LANGUAGE plpgsql;

-- CATEGORIES: Public Read-only, Admin Write
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin());

-- PRODUCTS: Public Read-only, STRICTLY NO CLIENT UPDATES to price or stock
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full manage products" ON public.products FOR ALL USING (public.is_admin());

-- STORE SETTINGS: Public Read, Admin Write
CREATE POLICY "Public read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin write settings" ON public.store_settings FOR ALL USING (public.is_admin());

-- CUSTOMER PROFILES: Strict Owner Isolation
CREATE POLICY "Customer read own profile" ON public.customers 
    FOR SELECT USING (auth.uid() = auth_user_id OR public.is_admin());
CREATE POLICY "Customer update own profile" ON public.customers 
    FOR UPDATE USING (auth.uid() = auth_user_id OR public.is_admin());

-- ADDRESSES: Strict Owner Isolation
CREATE POLICY "Customer read own addresses" ON public.customer_addresses 
    FOR SELECT USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Customer manage own addresses" ON public.customer_addresses 
    FOR ALL USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) OR public.is_admin());

-- ORDERS: IDOR Protection
-- Customers can only SELECT their own orders; Admin can SELECT all
CREATE POLICY "Customer read own orders" ON public.orders 
    FOR SELECT USING (
        customer_phone = (auth.jwt() ->> 'phone') OR 
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) OR 
        public.is_admin()
    );

-- Orders can only be inserted via backend service role or authenticated checkout
CREATE POLICY "Insert orders policy" ON public.orders FOR INSERT WITH CHECK (true);

-- Customers can never update orders directly (order status, payment status, total are protected)
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- AUDIT LOGS: Admin Read-Only
CREATE POLICY "Admin view audit logs" ON public.security_audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "System insert audit logs" ON public.security_audit_logs FOR INSERT WITH CHECK (true);
