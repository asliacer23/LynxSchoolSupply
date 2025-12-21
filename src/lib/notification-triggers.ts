/**
 * Notification Triggers
 * Automatically send role-based notifications when important events occur
 * 
 * Now uses the refactored Build-Deliver pattern:
 * - Build: Classes build notification data (no DB queries)
 * - Deliver: Central function sends to role users (single DB query)
 */

import { supabase } from '@/lib/supabase';
import { 
  UserNotifications, 
  CashierNotifications, 
  OwnerNotifications, 
  SuperadminNotifications,
  deliverToRole,
  deliverToRoles
} from '@/lib/role-based-notifications';
import { createNotification } from '@/features/notifications/service';

/**
 * Trigger order-related notifications to appropriate roles
 */
export async function triggerOrderCreatedNotification(
  userId: string,
  orderId: string,
  total: number
) {
  try {
    // Build notifications (no DB queries yet)
    const userNotif = UserNotifications.buildOrderPlaced(orderId, total);
    const cashierNotif = CashierNotifications.buildNewOrderAlert(1, total);
    
    // Deliver to user directly
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (user) {
      await createNotification(userId, userNotif.title, userNotif.message, {
        notification_type: userNotif.notification_type,
        related_entity_id: userNotif.related_entity_id,
        related_entity_type: userNotif.related_entity_type,
        priority: userNotif.priority,
        metadata: userNotif.metadata,
        delivery_channel: userNotif.delivery_channel,
      });
    }

    // Deliver to cashiers (one role query)
    await deliverToRole('cashier', cashierNotif);

    // Deliver to owner if high-value order (one role query)
    if (total > 100 && user?.email) {
      const ownerNotif = OwnerNotifications.buildHighValueOrder(orderId, total, user.email);
      await deliverToRole('owner', ownerNotif);
    }

    // Superadmin gets system event
    const adminNotif = SuperadminNotifications.buildSystemEvent(
      `New order created: ${orderId.slice(0, 8)} - $${total.toFixed(2)}`,
      'info'
    );
    await deliverToRole('superadmin', adminNotif);

  } catch (error) {
    console.error('Failed to send order created notification:', error);
  }
}

/**
 * Trigger order status change notifications
 */
export async function triggerOrderStatusNotification(
  userId: string,
  orderId: string,
  newStatus: string
) {
  try {
    // Build notifications
    const userNotif = UserNotifications.buildOrderStatusChanged(orderId, newStatus);

    // Deliver to user
    await createNotification(userId, userNotif.title, userNotif.message, {
      notification_type: userNotif.notification_type,
      related_entity_id: userNotif.related_entity_id,
      related_entity_type: userNotif.related_entity_type,
      priority: userNotif.priority,
      metadata: userNotif.metadata,
      delivery_channel: userNotif.delivery_channel,
    });

    // Deliver to cashiers for certain statuses
    if (['processing', 'completed'].includes(newStatus)) {
      const cashierNotif = CashierNotifications.buildNewOrderAlert(1, 0);
      await deliverToRole('cashier', cashierNotif);
    }
  } catch (error) {
    console.error('Failed to send order status notification:', error);
  }
}

/**
 * Trigger payment-related notifications
 */
export async function triggerPaymentCompletedNotification(
  userId: string,
  orderId: string,
  amount: number,
  method: string
) {
  try {
    // Build notifications
    const userNotif = UserNotifications.buildPaymentReceived(orderId, amount, method);
    const cashierNotif = CashierNotifications.buildPaymentProcessed(orderId, amount, method);
    const adminNotif = SuperadminNotifications.buildSystemEvent(
      `Payment completed: ${orderId.slice(0, 8)} - $${amount.toFixed(2)} via ${method}`,
      'info'
    );

    // Deliver to user
    await createNotification(userId, userNotif.title, userNotif.message, {
      notification_type: userNotif.notification_type,
      related_entity_id: userNotif.related_entity_id,
      related_entity_type: userNotif.related_entity_type,
      priority: userNotif.priority,
      metadata: userNotif.metadata,
      delivery_channel: userNotif.delivery_channel,
    });

    // Batch deliver to cashiers and superadmins
    await deliverToRoles({
      cashier: cashierNotif,
      superadmin: adminNotif
    });

  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }
}

/**
 * Trigger payment failure notifications
 */
export async function triggerPaymentFailedNotification(
  userId: string,
  orderId: string,
  amount: number,
  method: string
) {
  try {
    // Build notifications
    const userNotif = UserNotifications.buildPaymentFailed(orderId, amount);
    const ownerNotif = OwnerNotifications.buildPaymentIssue(orderId, `Payment via ${method} failed`);
    const adminNotif = SuperadminNotifications.buildOperationFailed(
      'Payment Processing',
      `Payment ${orderId.slice(0, 8)} via ${method} failed`
    );

    // Deliver to user
    await createNotification(userId, userNotif.title, userNotif.message, {
      notification_type: userNotif.notification_type,
      related_entity_id: userNotif.related_entity_id,
      related_entity_type: userNotif.related_entity_type,
      priority: userNotif.priority,
      metadata: userNotif.metadata,
      delivery_channel: userNotif.delivery_channel,
    });

    // Batch deliver to owner and superadmin
    await deliverToRoles({
      owner: ownerNotif,
      superadmin: adminNotif
    });

  } catch (error) {
    console.error('Failed to send payment failed notification:', error);
  }
}

/**
 * Trigger product-related notifications
 */
export async function triggerProductNotification(
  userId: string,
  action: string,
  productName: string
) {
  try {
    // Superadmin gets notified of product changes
    const actionLabels: Record<string, string> = {
      created: 'Product added to catalog',
      updated: 'Product information updated',
      deleted: 'Product removed from catalog',
      archived: 'Product archived',
      restored: 'Product restored',
    };
    
    const adminNotif = SuperadminNotifications.buildSystemEvent(
      `${action.toUpperCase()}: ${productName} - ${actionLabels[action] || action}`
    );
    await deliverToRole('superadmin', adminNotif);
  } catch (error) {
    console.error('Failed to send product notification:', error);
  }
}

/**
 * Trigger low stock notifications
 */
export async function triggerLowStockNotification(
  productName: string,
  currentStock: number,
  lowStockThreshold: number = 10
) {
  try {
    // Owner gets notified of low stock
    const ownerNotif = OwnerNotifications.buildLowStockAlert(productName, currentStock, lowStockThreshold);
    await deliverToRole('owner', ownerNotif);
  } catch (error) {
    console.error('Failed to send low stock notification:', error);
  }
}

/**
 * Trigger cleanup job completion notifications
 */
export async function triggerCleanupNotification(jobName: string, itemsDeleted: number) {
  try {
    // Superadmin gets notified of cleanup jobs
    const adminNotif = SuperadminNotifications.buildCleanupJobCompleted(jobName, itemsDeleted);
    await deliverToRole('superadmin', adminNotif);
  } catch (error) {
    console.error('Failed to send cleanup notification:', error);
  }
}
