import { supabase } from '@/lib/supabase';
import { canAccess, AuthorizationError } from '@/lib/authorization';
import type { Order, OrderItem, CartItem, RoleName } from '@/types/database';

/**
 * Create order (user creates their own, cashier creates on behalf of user, superadmin can create any)
 * Delegates to shared service but adds authorization layer
 */
export async function createOrder(
  userId: string,
  cartItems: CartItem[],
  currentUserId: string,
  userRoles: RoleName[],
  cashierId?: string,
  deliveryAddress?: string,
  deliveryContactNum?: string
) {
  // Authorization check
  if (!canAccess(userRoles, 'create_order')) {
    throw new AuthorizationError('You do not have permission to create orders', 'create_order');
  }

  // Users can only create for themselves
  if (userRoles.includes('user') && userId !== currentUserId) {
    throw new AuthorizationError('You can only create orders for yourself');
  }

  const total = cartItems.reduce((sum, item) => {
    return sum + (Number(item.product?.price ?? 0) * item.quantity);
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      cashier_id: cashierId || null,
      total,
      status: 'pending',
      address: deliveryAddress || null,
      contact_num: deliveryContactNum || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: Number(item.product?.price ?? 0),
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  return { data: order as Order, error: null };
}

/**
 * Get user's own orders
 */
export async function getUserOrders(userId: string, currentUserId: string, userRoles: RoleName[]) {
  // Users can only see their own orders
  if (userRoles.includes('user') && userId !== currentUserId) {
    throw new AuthorizationError('You can only view your own orders');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data as Order[] | null, error };
}

/**
 * Get order with items (permission-aware)
 */
export async function getOrderWithItems(
  orderId: string,
  currentUserId: string,
  userRoles: RoleName[]
) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  // Authorization check - users can only view their own orders
  if (userRoles.includes('user') && order.user_id !== currentUserId) {
    throw new AuthorizationError('You do not have permission to view this order');
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*, product:products(*)')
    .eq('order_id', orderId);

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  return {
    data: { ...order, items: items as OrderItem[] } as Order,
    error: null,
  };
}

/**
 * Get all orders (staff only - superadmin, owner, cashier)
 * IMPORTANT: Cashier can only see their own orders
 */
export async function getAllOrders(userRoles: RoleName[], currentUserId?: string) {
  // Cashiers can only see their own orders
  if (userRoles.includes('cashier') && !userRoles.includes('owner') && !userRoles.includes('superadmin')) {
    if (!currentUserId) {
      throw new AuthorizationError('Cashier ID is required');
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('cashier_id', currentUserId)
      .order('created_at', { ascending: false });
    return { data: data as Order[] | null, error };
  }

  // Owner and superadmin can see all orders
  if (!canAccess(userRoles, 'view_all_orders')) {
    throw new AuthorizationError('You do not have permission to view all orders', 'view_all_orders');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data as Order[] | null, error };
}

/**
 * Update order status (staff only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  userRoles: RoleName[],
  cashierId?: string
) {
  // Authorization check
  if (!canAccess(userRoles, 'update_order_status')) {
    throw new AuthorizationError(
      'You do not have permission to update orders',
      'update_order_status'
    );
  }

  const updates: Record<string, unknown> = { status };
  if (cashierId) {
    updates.cashier_id = cashierId;
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  return { data: data as Order | null, error };
}
