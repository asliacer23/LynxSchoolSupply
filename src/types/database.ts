export interface Role {
  id: string;
  name: 'superadmin' | 'owner' | 'cashier' | 'user';
  description: string | null;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string;
  role?: Role;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  address: string | null;
  contact_num: string | null;
  preferences: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  file_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Taggable {
  tag_id: string;
  entity_type: string;
  entity_id: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Favorite {
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string | null;
  cashier_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  price: number;
  quantity: number;
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string | null;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
}

export interface File {
  id: string;
  owner_id: string | null;
  file_url: string | null;
  type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  notification_type?: string | null;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown> | null;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  delivery_channel?: 'database' | 'email' | 'sms' | 'push';
}

export interface SystemSetting {
  key: string;
  value: Record<string, unknown> | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string | null;
  table_name: string | null;
  record_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type RoleName = 'superadmin' | 'owner' | 'cashier' | 'user';
export type Permission =
  | 'view_products'
  | 'create_product'
  | 'edit_product'
  | 'delete_product'
  | 'manage_categories'
  | 'view_cart'
  | 'add_to_cart'
  | 'checkout'
  | 'view_own_orders'
  | 'view_all_orders'
  | 'create_order'
  | 'update_order_status'
  | 'view_dashboard'
  | 'manage_users'
  | 'access_admin_panel'
  | 'view_audit_logs'
  | 'edit_profile'
  | 'edit_own_profile';