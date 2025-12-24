import { supabase } from '@/lib/supabase';
import { logOrderCreated, logOrderUpdated } from '@/lib/audit-logger';
import { triggerOrderCreatedNotification, triggerOrderStatusNotification } from '@/lib/notification-triggers';

/**
 * Create a new order
 * Shared by: cashier, orders, dashboard
 * @param userId - Customer user ID (null for walk-in customers in POS)
 * @param cartItems - Array of items to order with product_id, quantity, and price
 * @param cashierId - Cashier ID (for POS orders only)
 * @param userRoles - User roles for authorization
 * @param orderData - Shipping address and other order details
 */
export async function createOrder(
  userId: string | null,
  cartItems: Array<{ product_id: string; quantity: number; price?: number }>,
  cashierId?: string,
  userRoles: string[] = [],
  orderData?: {
    shipping_address?: Record<string, unknown>;
  }
) {
  // Calculate total from items before creating order
  const total = cartItems.reduce((sum, item) => {
    return sum + ((item.price ?? 0) * item.quantity);
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      cashier_id: cashierId || null,
      status: 'pending',
      total: total,
      shipping_address: orderData?.shipping_address || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  // Insert order items with correct prices
  const itemsWithOrderId = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    price: item.price ?? 0,
    quantity: item.quantity,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)
    .select();

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  // Log the order creation
  if (order) {
    await logOrderCreated(userId, order.id, total);
    // Send notification to user
    if (userId) {
      await triggerOrderCreatedNotification(userId, order.id, total);
    }
  }

  return { data: order as Order, error: null };
}

/**
 * Get all orders
 * Shared by: dashboard, orders-management
 */
export async function getAllOrders(userRoles: string[] = [], currentUserId?: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, cashier_id, status, total, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update order status
 * Shared by: dashboard, orders-management
 */
export async function updateOrderStatus(orderId: string, status: string, userRoles: string[] = [], userId?: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  // Log the status update
  if (data && !error && userId) {
    await logOrderUpdated(userId, orderId, status);
    // Send notification to user (if they exist and order belongs to them)
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();
    
    if (order?.user_id) {
      await triggerOrderStatusNotification(order.user_id, orderId, status);
    }
  }

  if (error) {
    console.error('Error updating order status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get orders by cashier
 * Shared by: dashboard, orders-management
 */
export async function getOrdersByCashier(cashierId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, cashier_id, status, total, created_at, updated_at')
    .eq('cashier_id', cashierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cashier orders:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, cashier_id, status, total, created_at, updated_at')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order details:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get order items
 */
export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, price, quantity')
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching order items:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
