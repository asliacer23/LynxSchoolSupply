import { supabase } from '@/lib/supabase';
import { canAccess, AuthorizationError } from '@/lib/authorization';
import type { Order, OrderItem, CartItem, RoleName } from '@/types/database';
// Import shared services to avoid duplication
import {
  getAllOrders as sharedGetAllOrders,
  getOrderDetails as sharedGetOrderDetails,
  getOrderItems as sharedGetOrderItems,
} from '@/lib/shared-services/orderService';
import { getPaymentByOrderId, getAllPayments as sharedGetAllPayments } from '@/lib/shared-services/paymentService';

// ==========================================
// Order Creation & Management
// ==========================================

/**
 * Create a new order
 * Authorization: create_order permission required
 * Users can only create for themselves
 * Cashiers can create on behalf of users
 * Superadmin/owner can create for anyone
 */
export async function createOrder(
  userId: string,
  cartItems: CartItem[],
  currentUserId: string,
  userRoles: RoleName[],
  cashierId?: string
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

// ==========================================
// Order Retrieval & Viewing
// ==========================================

/**
 * Get user's own orders
 * Authorization: view_own_orders permission required
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
 * Users can only view their own orders
 * Staff can view all orders
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
 * Get all orders with detailed information
 * Authorization: view_all_orders permission required (superadmin, owner)
 * Cashiers can only see orders they processed
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

// ==========================================
// Order Status Management
// ==========================================

/**
 * Update order status (staff only)
 * Authorization: update_order_status permission required
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

// ==========================================
// Order Details (consolidated from orders-management)
// ==========================================

/**
 * Get single order with all details for receipt
 * Wrapper around shared service
 */
export async function getOrderDetails(orderId: string) {
  return sharedGetOrderDetails(orderId);
}

/**
 * Get order items (products and quantities)
 * Wrapper around shared service
 */
export async function getOrderItems(orderId: string) {
  return sharedGetOrderItems(orderId);
}

/**
 * Get payment information for order
 * Wrapper around shared service
 */
export async function getOrderPayment(orderId: string) {
  const result = await getPaymentByOrderId(orderId);
  return { data: result.data, error: result.error };
}

/**
 * Get all payments for reporting/calculations
 * Wrapper around shared service
 */
export async function getAllPayments() {
  const result = await sharedGetAllPayments();
  return { data: result.data, error: result.error };
}

// ==========================================
// Order Analytics & Reporting
// ==========================================

/**
 * Calculate order statistics for reports
 */
export async function calculateOrderStats(): Promise<{
  data: any | null;
  error: any;
}> {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total');

    if (ordersError) throw ordersError;

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('method, amount, status');

    if (paymentsError) throw paymentsError;

    const orderList = orders || [];
    const paymentList = payments || [];

    // Calculate metrics
    const totalOrders = orderList.length;
    const completedOrders = orderList.filter(o => o.status === 'completed').length;
    const pendingOrders = orderList.filter(o => o.status === 'pending').length;
    const totalRevenue = orderList.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment method breakdown
    const methodBreakdown: Record<string, number> = {
      cash: 0,
      gcash: 0,
      paymaya: 0,
    };

    paymentList.forEach(p => {
      const method = (p.method || 'cash').toLowerCase();
      if (method in methodBreakdown) {
        methodBreakdown[method] += Number(p.amount);
      }
    });

    return {
      data: {
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        averageOrderValue,
        paymentMethodBreakdown: methodBreakdown,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return { data: null, error };
  }
}

/**
 * Get orders by cashier (for individual cashier reports)
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

  return { data: data as any[] | null, error: null };
}

/**
 * Get orders by date range (for daily/weekly/monthly reports)
 */
export async function getOrdersByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, cashier_id, status, total, created_at, updated_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by date range:', error);
    return { data: null, error };
  }

  return { data: data as any[] | null, error: null };
}
