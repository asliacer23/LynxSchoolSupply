import { supabase } from '@/lib/supabase';
import { canAccess, AuthorizationError } from '@/lib/authorization';
import type { Product, RoleName } from '@/types/database';

export async function getDashboardStats(userRoles: RoleName[] = []) {
  // Authorization check
  if (!canAccess(userRoles, 'view_dashboard')) {
    throw new AuthorizationError('You do not have permission to view dashboard', 'view_dashboard');
  }

  const [ordersResult, productsResult, usersResult] = await Promise.all([
    supabase.from('orders').select('id, total, status'),
    supabase.from('products').select('id, stock'),
    supabase.from('profiles').select('id'),
  ]);

  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];
  const users = usersResult.data ?? [];

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock <= 5).length;

  return {
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders,
    totalProducts: products.length,
    lowStockProducts,
    totalUsers: users.length,
  };
}

export async function getAllProducts(userRoles: RoleName[] = []) {
  // Only admins can see all products including inactive/archived
  if (!canAccess(userRoles, 'edit_product')) {
    throw new AuthorizationError('You do not have permission to view all products', 'edit_product');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .order('name');

  return { data: data as Product[] | null, error };
}

export async function createProduct(
  product: { name: string; price: number; stock?: number; description?: string; category_id?: string; is_active?: boolean },
  userRoles: RoleName[] = [],
  userId?: string
) {
  // Authorization check - only admins can create products
  if (!canAccess(userRoles, 'create_product')) {
    throw new AuthorizationError('You do not have permission to create products', 'create_product');
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, created_by: userId })
    .select()
    .single();

  return { data: data as Product | null, error };
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  userRoles: RoleName[] = []
) {
  // Authorization check - only admins can update products
  if (!canAccess(userRoles, 'edit_product')) {
    throw new AuthorizationError('You do not have permission to edit products', 'edit_product');
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Product | null, error };
}

export async function deleteProduct(id: string, userRoles: RoleName[] = []) {
  // Authorization check - only admins can delete products
  if (!canAccess(userRoles, 'delete_product')) {
    throw new AuthorizationError('You do not have permission to delete products', 'delete_product');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  return { error };
}
