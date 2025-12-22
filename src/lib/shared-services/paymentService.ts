import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/audit-logger';
import { triggerPaymentCompletedNotification, triggerPaymentFailedNotification } from '@/lib/notification-triggers';

export interface PaymentInput {
  order_id: string;
  method: 'gcash' | 'paymaya' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  reference_number?: string;
  change_amount?: number;
}

/**
 * Create a new payment
 * Shared by: cashier, orders
 * When payment is created with 'completed' status, auto-complete POS orders
 */
export async function createPayment(paymentData: PaymentInput, userId?: string) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: paymentData.order_id,
      method: paymentData.method,
      status: paymentData.status,
      amount: paymentData.amount,
      reference_number: paymentData.reference_number,
      change_amount: paymentData.change_amount,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return { data: null, error };
  }

  // Log payment creation
  if (data && userId) {
    await logAction(userId, 'CREATE', 'payments', data.id, {
      order_id: paymentData.order_id,
      method: paymentData.method,
      amount: paymentData.amount,
      status: paymentData.status,
    });
  }

  // Auto-complete POS orders when payment is created as 'completed'
  if (data && paymentData.status === 'completed') {
    const order = await supabase
      .from('orders')
      .select('user_id, cashier_id, status')
      .eq('id', paymentData.order_id)
      .maybeSingle();

    // POS orders have cashier_id set and no user_id (walk-in customers)
    if (order.data?.cashier_id && !order.data?.user_id && order.data?.status === 'pending') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', paymentData.order_id);

      if (updateError) {
        console.error('Error auto-completing POS order:', updateError);
      }
    }
  }

  return { data, error: null };
}

/**
 * Update payment status
 * Shared by: cashier, orders, dashboard
 * When payment is completed, auto-complete POS orders (face-to-face transactions)
 */
export async function updatePaymentStatus(paymentId: string, status: 'completed' | 'failed' | 'pending', userId?: string) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    return { data: null, error };
  }

  // Log payment status update
  if (data && userId) {
    await logAction(userId, 'UPDATE', 'payments', paymentId, {
      new_status: status,
      timestamp: new Date().toISOString(),
    });
    
    // Send notification based on payment status
    const order = await supabase
      .from('orders')
      .select('user_id, cashier_id')
      .eq('id', data.order_id)
      .maybeSingle();
    
    if (status === 'completed') {
      // Auto-complete POS orders (face-to-face transactions)
      // POS orders have cashier_id set and no user_id (walk-in customers)
      if (order.data?.cashier_id && !order.data?.user_id) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', data.order_id);
        
        if (updateError) {
          console.error('Error auto-completing POS order:', updateError);
        }
      }

      if (order.data?.user_id && data.amount) {
        await triggerPaymentCompletedNotification(
          order.data.user_id,
          data.order_id,
          data.amount,
          data.method || 'Unknown'
        );
      }
    } else if (status === 'failed') {
      if (order.data?.user_id && data.amount) {
        await triggerPaymentFailedNotification(
          order.data.user_id,
          data.order_id,
          data.amount,
          data.method || 'Unknown'
        );
      }
    }
  }

  return { data, error: null };
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, method, status, amount, reference_number, change_amount, created_at')
    .eq('order_id', orderId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get all payments
 */
export async function getAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, method, status, amount, reference_number, change_amount, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics() {
  const { data, error } = await supabase
    .from('payments')
    .select('method, status, amount')
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching payment statistics:', error);
    return { data: null, error };
  }

  const stats = {
    total: 0,
    byMethod: {
      gcash: 0,
      paymaya: 0,
      cash: 0,
    },
  };

  if (data) {
    data.forEach((payment: any) => {
      stats.total += payment.amount;
      stats.byMethod[payment.method] = (stats.byMethod[payment.method] || 0) + payment.amount;
    });
  }

  return { data: stats, error: null };
}
