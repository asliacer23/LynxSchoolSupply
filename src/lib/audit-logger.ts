import { createAuditLog } from '@/features/audit-logs/services/auditLogs.service';

/**
 * Log helper for automatic audit logging
 * Use this across the application to track user actions
 */

export async function logAction(
  userId: string | undefined,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, any>
) {
  if (!userId) {
    console.warn('Cannot log action without userId');
    return;
  }

  try {
    await createAuditLog(userId, action, tableName, recordId, metadata);
  } catch (error) {
    console.error('Failed to log action:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Common action loggers
 */

export async function logProductCreated(userId: string, productId: string, productName: string) {
  await logAction(userId, 'CREATE', 'products', productId, { product_name: productName });
}

export async function logProductUpdated(userId: string, productId: string, changes: Record<string, any>) {
  await logAction(userId, 'UPDATE', 'products', productId, { changes });
}

export async function logProductDeleted(userId: string, productId: string, productName: string) {
  await logAction(userId, 'DELETE', 'products', productId, { product_name: productName });
}

export async function logOrderCreated(userId: string, orderId: string, total: number) {
  await logAction(userId, 'CREATE', 'orders', orderId, { total, timestamp: new Date().toISOString() });
}

export async function logOrderUpdated(userId: string, orderId: string, status: string) {
  await logAction(userId, 'UPDATE', 'orders', orderId, { status, timestamp: new Date().toISOString() });
}

export async function logPaymentCreated(userId: string, paymentId: string, method: string, amount: number) {
  await logAction(userId, 'CREATE', 'payments', paymentId, { method, amount });
}

export async function logPaymentUpdated(userId: string, paymentId: string, status: string) {
  await logAction(userId, 'UPDATE', 'payments', paymentId, { status, timestamp: new Date().toISOString() });
}

export async function logUserLogin(userId: string) {
  await logAction(userId, 'LOGIN', 'users', userId, { timestamp: new Date().toISOString() });
}

export async function logUserLogout(userId: string) {
  await logAction(userId, 'LOGOUT', 'users', userId, { timestamp: new Date().toISOString() });
}

export async function logRoleAssigned(adminUserId: string, targetUserId: string, role: string) {
  await logAction(adminUserId, 'ASSIGN_ROLE', 'user_roles', targetUserId, { role, timestamp: new Date().toISOString() });
}

export async function logRoleRemoved(adminUserId: string, targetUserId: string, role: string) {
  await logAction(adminUserId, 'REMOVE_ROLE', 'user_roles', targetUserId, { role, timestamp: new Date().toISOString() });
}

export async function logProfileUpdated(userId: string, changes: Record<string, any>) {
  await logAction(userId, 'UPDATE', 'profiles', userId, { changes });
}
