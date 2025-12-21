import { supabase } from '@/lib/supabase';
import type { OrderWithDetails, OrderItemDetail, PaymentDetail, OrderReport } from './types';
// Import shared services to avoid duplication
import {
  getAllOrders as sharedGetAllOrders,
  getOrderDetails as sharedGetOrderDetails,
  getOrderItems as sharedGetOrderItems,
} from '@/lib/shared-services/orderService';
import { getPaymentByOrderId, getAllPayments as sharedGetAllPayments } from '@/lib/shared-services/paymentService';

/**
 * Get all orders with cashier and customer details
 * For superadmin and owner to view all transactions
 * Uses shared service
 */
export async function getAllOrders() {
  return sharedGetAllOrders();
}

/**
 * Get single order with all details for receipt
 * Uses shared service
 */
export async function getOrderDetails(orderId: string) {
  return sharedGetOrderDetails(orderId);
}

/**
 * Get order items (products and quantities)
 * Uses shared service
 */
export async function getOrderItems(orderId: string) {
  return sharedGetOrderItems(orderId);
}

/**
 * Get payment information for order
 * Uses shared service
 */
export async function getOrderPayment(orderId: string) {
  const result = await getPaymentByOrderId(orderId);
  return { data: result.data as PaymentDetail | null, error: result.error };
}

/**
 * Get all payments for reporting/calculations
 * Uses shared service
 */
export async function getAllPayments() {
  const result = await sharedGetAllPayments();
  return { data: result.data as PaymentDetail[] | null, error: result.error };
}

/**
 * Calculate order statistics for reports
 */
export async function calculateOrderStats(): Promise<{
  data: OrderReport | null;
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
