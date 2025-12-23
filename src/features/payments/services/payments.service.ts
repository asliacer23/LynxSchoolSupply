import { supabase } from '@/lib/supabase';
import type { RoleName } from '@/types/database';

export type PaymentMethod = 'gcash' | 'paymaya' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  reference_number?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Create a payment record for an order
 */
export async function createPayment(
  orderId: string,
  method: PaymentMethod,
  amount: number,
  referenceNumber?: string,
  metadata?: Record<string, any>
) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      method,
      amount,
      status: 'pending',
      reference_number: referenceNumber,
      metadata: metadata || {},
    })
    .select()
    .single();

  return { data: data as Payment | null, error };
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  return { data: data as Payment | null, error };
}

/**
 * Get payment by payment ID
 */
export async function getPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();

  return { data: data as Payment | null, error };
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  paidAt?: string
) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      paid_at: status === 'completed' ? (paidAt || new Date().toISOString()) : null,
    })
    .eq('id', paymentId)
    .select()
    .single();

  return { data: data as Payment | null, error };
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string) {
  if (!userId) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      order:orders(id, status, total, created_at)
    `)
    .eq('orders.user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data as unknown as any[] | null, error };
}

/**
 * Get all payments (admin)
 */
export async function getAllPayments(userRoles: RoleName[] = []) {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      order:orders(id, user_id, status, total, created_at, user:profiles(full_name, email))
    `)
    .order('created_at', { ascending: false });

  return { data: data as unknown as any[] | null, error };
}

/**
 * Get payment statistics (admin dashboard)
 */
export async function getPaymentStats() {
  try {
    // Total revenue from completed payments
    const { data: completedPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = completedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Payment methods breakdown
    const { data: paymentMethods } = await supabase
      .from('payments')
      .select('method, amount')
      .eq('status', 'completed');

    const methodBreakdown: Record<PaymentMethod, number> = {
      gcash: 0,
      paymaya: 0,
      cash: 0,
    };

    paymentMethods?.forEach(p => {
      methodBreakdown[p.method as PaymentMethod] += Number(p.amount);
    });

    // Pending payments
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    const pendingAmount = pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Failed payments
    const { data: failedPayments, count: failedCount } = await supabase
      .from('payments')
      .select('id', { count: 'exact' })
      .eq('status', 'failed');

    return {
      data: {
        totalRevenue,
        methodBreakdown,
        pendingAmount,
        failedPaymentsCount: failedCount || 0,
        totalTransactions: completedPayments?.length || 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Process a payment (mock implementation - integrate with real payment provider)
 */
export async function processPayment(
  paymentId: string,
  paymentDetails: {
    method: PaymentMethod;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    gcashNumber?: string;
    bankAccount?: string;
  }
) {
  // In real implementation, this would call your payment provider's API
  // For now, we'll simulate processing

  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark as completed (in real app, only after provider confirms)
    const result = await updatePaymentStatus(paymentId, 'completed');

    return result;
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Validate payment method data
 */
export function validatePaymentMethod(
  method: PaymentMethod,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (method) {
    case 'gcash':
      if (!data.gcashNumber || !/^09\d{9}$/.test(data.gcashNumber)) {
        errors.push('Invalid GCash number');
      }
      break;

    case 'paymaya':
      if (!data.payMayaNumber || !/^09\d{9}$/.test(data.payMayaNumber)) {
        errors.push('Invalid PayMaya number');
      }
      break;

    case 'cash':
      if (data.amountReceived === undefined || data.amountReceived === null) {
        errors.push('Amount received is required');
      }
      if (Number(data.amountReceived) <= 0) {
        errors.push('Amount received must be greater than 0');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get payment methods available
 */
export function getAvailablePaymentMethods(): Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> {
  return [
    {
      value: 'gcash',
      label: 'GCash',
      description: 'Mobile wallet payment',
    },
    {
      value: 'paymaya',
      label: 'PayMaya',
      description: 'Digital payment platform',
    },
    {
      value: 'cash',
      label: 'Cash Payment',
      description: 'Pay on the spot with cash',
    },
  ];
}
