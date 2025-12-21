

-- ================================
-- EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- ROLES TABLE
-- ================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('superadmin', 'owner', 'cashier', 'user')),
  description TEXT
);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('superadmin', 'Full system access'),
  ('owner', 'Store owner with management access'),
  ('cashier', 'Can process orders and manage inventory'),
  ('user', 'Regular customer');

-- ================================
-- USER ROLES
-- ================================
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- ================================
-- PROFILES
-- ================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  address TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- CATEGORIES
-- ================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
  ('Writing', 'Pens, pencils, markers and more'),
  ('Paper', 'Notebooks, loose leaf, and specialty paper'),
  ('Organization', 'Folders, binders, and storage'),
  ('Art Supplies', 'Colors, brushes, and creative tools'),
  ('Tech Accessories', 'Calculators, USB drives, and more');

-- ================================
-- PRODUCTS
-- ================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- PRODUCT IMAGES
-- ================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- TAGS
-- ================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE public.taggables (
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  PRIMARY KEY (tag_id, entity_type, entity_id)
);

-- ================================
-- CARTS & FAVORITES
-- ================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ================================
-- ORDERS & PAYMENTS
-- ================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  cashier_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  total NUMERIC NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT,
  amount NUMERIC CHECK (amount >= 0),
  status TEXT,
  paid_at TIMESTAMPTZ
);

-- ================================
-- FILES & NOTIFICATIONS
-- ================================
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  file_url TEXT,
  type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- SYSTEM SETTINGS & AUDIT LOGS
-- ================================
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENABLE RLS ON ALL TABLES
-- ================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================
-- HELPER FUNCTIONS
-- ================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name IN ('superadmin', 'owner', 'cashier')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name IN ('superadmin', 'owner')
  )
$$;

-- ================================
-- RLS POLICIES
-- ================================

-- Roles
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Superadmin can manage roles" ON public.roles FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- Products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true AND is_archived = false);
CREATE POLICY "Staff can view all products" ON public.products FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin(auth.uid()));

-- Product Images
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin(auth.uid()));

-- Tags
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.tags FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can view taggables" ON public.taggables FOR SELECT USING (true);
CREATE POLICY "Admins can manage taggables" ON public.taggables FOR ALL USING (public.is_admin(auth.uid()));

-- Carts
CREATE POLICY "Users can view own cart" ON public.carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cart" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON public.carts FOR DELETE USING (auth.uid() = user_id);

-- Cart Items
CREATE POLICY "Users can view own cart items" ON public.cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- Favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (public.is_staff(auth.uid()));

-- Order Items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Staff can view all order items" ON public.order_items FOR SELECT USING (public.is_staff(auth.uid()));

-- Payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Staff can view all payments" ON public.payments FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage payments" ON public.payments FOR ALL USING (public.is_staff(auth.uid()));

-- Files
CREATE POLICY "Users can view own files" ON public.files FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own files" ON public.files FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can view all files" ON public.files FOR SELECT USING (public.is_admin(auth.uid()));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));

-- System Settings
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Superadmin can manage settings" ON public.system_settings FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ================================
-- TRIGGERS
-- ================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- NEW USER TRIGGER
-- ================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
  
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, user_role_id);
  
  INSERT INTO public.carts (user_id, status)
  VALUES (NEW.id, 'active');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();