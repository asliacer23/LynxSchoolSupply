import { supabase } from '@/lib/supabase';
import { logOrderCreated, logOrderUpdated } from '@/lib/audit-logger';
import { triggerOrderCreatedNotification, triggerOrderStatusNotification } from '@/lib/notification-triggers';

/**
 * Create a new order
 * Shared by: cashier, orders, dashboard
 */
export async function createOrder(
  userId: string,
  cartItems: Array<{ product_id: string; quantity: number }>,
  cashierId?: string,
  userRoles: string[] = []
) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      cashier_id: cashierId,
      status: 'pending',
      total: 0,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  // Insert order items
  const itemsWithOrderId = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    price: 0,
    quantity: item.quantity,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)
    .select();

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  // Fetch product prices and calculate total
  let total = 0;
  for (const item of cartItems) {
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', item.product_id)
      .single();

    if (product) {
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
    }
  }

  // Update order total
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ total })
    .eq('id', order.id)
    .select()
    .single();

  // Log the order creation
  if (updatedOrder && !updateError) {
    await logOrderCreated(userId, updatedOrder.id, total);
    // Send notification to user
    await triggerOrderCreatedNotification(userId, updatedOrder.id, total);
  }

  return { data: updatedOrder, error: updateError };
}

/**
 * Get all orders
 * Shared by: dashboard, orders-management
 */
export async function getAllOrders() {
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
export async function updateOrderStatus(orderId: string, status: string, userId?: string) {
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
