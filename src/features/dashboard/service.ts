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

export async function checkProductOrders(id: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('id')
    .eq('product_id', id)
    .limit(1);

  return { hasOrders: (data?.length ?? 0) > 0, error };
}

export async function deleteProduct(id: string, userRoles: RoleName[] = []) {
  // Authorization check - only admins can delete products
  if (!canAccess(userRoles, 'delete_product')) {
    throw new AuthorizationError('You do not have permission to delete products', 'delete_product');
  }

  // Check if product has any orders
  const { hasOrders, error: checkError } = await checkProductOrders(id);
  
  if (checkError) {
    throw new Error(checkError.message || 'Failed to check product orders');
  }

  if (hasOrders) {
    throw new Error(
      'Cannot delete this product because it has been used in orders. Archive it instead to hide it from customers.'
    );
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete product');
  }

  return { error };
}

export async function archiveProduct(
  id: string,
  userRoles: RoleName[] = []
) {
  // Authorization check - only admins can archive products
  if (!canAccess(userRoles, 'edit_product')) {
    throw new AuthorizationError('You do not have permission to archive products', 'edit_product');
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: true, is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to archive product');
  }

  return { data: data as Product | null, error };
}
