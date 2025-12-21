import { supabase } from '@/lib/supabase';
import type { Notification, RoleName } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data as Notification[] | null, error };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);

  return { count: data?.length ?? 0, error };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();

  return { data: data as Notification | null, error };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return { error };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  return { error };
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('is_read', true);

  return { error };
}

/**
 * Create a notification (for system use - triggered by orders, payments, etc.)
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  options?: {
    notification_type?: string;
    related_entity_id?: string;
    related_entity_type?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
    delivery_channel?: 'database' | 'email' | 'sms' | 'push';
  }
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      is_read: false,
      notification_type: options?.notification_type,
      related_entity_id: options?.related_entity_id,
      related_entity_type: options?.related_entity_type,
      priority: options?.priority ?? 'medium',
      metadata: (options?.metadata as Json) ?? null,
      status: 'pending',
      delivery_channel: options?.delivery_channel ?? 'database',
    })
    .select()
    .single();

  return { data: data as Notification | null, error };
}

/**
 * Notify user when their order status changes
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  newStatus: string
) {
  const statusMessages: Record<string, string> = {
    pending: 'Your order has been placed and is pending',
    processing: 'Your order is being processed',
    completed: 'Your order has been completed',
    cancelled: 'Your order has been cancelled',
  };

  const message = statusMessages[newStatus] || `Your order status changed to ${newStatus}`;

  return createNotification(
    userId,
    'Order Status Update',
    message
  );
}

/**
 * Notify admins of low stock products
 */
export async function notifyLowStockToAdmins(
  productName: string,
  currentStock: number
) {
  // Get all admins
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role_id', [
      // Will be populated by role names in actual use
    ]);

  if (!admins || admins.length === 0) return { error: null };

  // Notify each admin
  const notifications = admins.map(admin =>
    createNotification(
      admin.user_id,
      'Low Stock Alert',
      `${productName} is running low (${currentStock} remaining)`
    )
  );

  await Promise.all(notifications);
  return { error: null };
}

/**
 * Listen to real-time notification changes for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return subscription;
}
