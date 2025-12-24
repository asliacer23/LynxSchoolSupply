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

  // Auto-complete orders when payment is created as 'completed'
  if (data && paymentData.status === 'completed') {
    const order = await supabase
      .from('orders')
      .select('user_id, cashier_id, status')
      .eq('id', paymentData.order_id)
      .maybeSingle();

    // Auto-complete POS orders (walk-in customers) OR any SuperAdmin/Owner orders
    if (order.data && (order.data?.status === 'pending' || order.data?.status === 'processing')) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', paymentData.order_id);

      if (updateError) {
        console.error('Error auto-completing order:', updateError);
      }
    }

    // Deduct stock from inventory when payment is confirmed
    const { success: stockSuccess, error: stockError } = await deductStockForOrder(paymentData.order_id);
    if (!stockSuccess) {
      console.error('Error deducting stock for order:', stockError);
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
      // Auto-complete orders when payment is completed
      // Works for POS orders (walk-in) and SuperAdmin/Owner orders
      if (order.data && (order.data?.status === 'pending' || order.data?.status === 'processing')) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', data.order_id);
        
        if (updateError) {
          console.error('Error auto-completing order:', updateError);
        }
      }

      // Deduct stock from inventory when payment is confirmed
      const { success: stockSuccess, error: stockError } = await deductStockForOrder(data.order_id);
      if (!stockSuccess) {
        console.error('Error deducting stock for order:', stockError);
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
 * Deduct stock for order items when payment is confirmed
 * Called when payment status is updated to 'completed'
 */
export async function deductStockForOrder(orderId: string) {
  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      console.error('Error fetching order items for stock deduction:', itemsError);
      return { success: false, error: itemsError };
    }

    // Deduct stock for each item
    for (const item of orderItems) {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        console.error(`Error fetching product ${item.product_id}:`, productError);
        continue;
      }

      // Calculate new stock (ensure it doesn't go below 0)
      const newStock = Math.max(0, (product.stock || 0) - item.quantity);

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deducting stock for order:', error);
    return { success: false, error };
  }
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
