import { supabase } from '@/lib/supabase';
import type { CashierPayment, CashierPaymentStatus, CashierPaymentMethod, POSCartItem } from './types';
import type { Product } from '@/types/database';
// Import shared services to avoid duplication
import { getPrimaryImageUrl, getPrimaryImageUrlById } from '@/lib/shared-services/imageService';
import { createPayment, updatePaymentStatus, getPaymentByOrderId } from '@/lib/shared-services/paymentService';

/**
 * Create a new payment record for cashier POS orders
 * Wrapper around shared service for cashier-specific typing
 */
export async function createCashierPayment(
  orderId: string,
  method: CashierPaymentMethod,
  amount: number,
  userId?: string
) {
  const result = await createPayment({
    order_id: orderId,
    method,
    amount,
    status: 'pending',
  }, userId);

  return {
    data: result.data as CashierPayment | null,
    error: result.error,
  };
}

/**
 * Update payment status (pending -> completed)
 * Wrapper around shared service for cashier-specific typing
 */
export async function updateCashierPaymentStatus(
  paymentId: string,
  status: CashierPaymentStatus,
  userId?: string
) {
  const result = await updatePaymentStatus(paymentId, status, userId);

  return {
    data: result.data as CashierPayment | null,
    error: result.error,
  };
}

/**
 * Get payment by ID
 */
export async function getCashierPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, method, amount, status, paid_at')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return { data: null, error };
  }

  return { data: data as CashierPayment, error: null };
}

/**
 * Get payment by order ID
 * Wrapper around shared service for cashier-specific typing
 */
export async function getCashierPaymentByOrderId(orderId: string) {
  const result = await getPaymentByOrderId(orderId);

  return {
    data: result.data as CashierPayment | null,
    error: result.error,
  };
}

// Re-export shared services for convenience
export { getPrimaryImageUrl, getPrimaryImageUrlById };
