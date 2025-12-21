/**
 * Database Cleanup Utilities
 * Run periodically to maintain database performance and storage
 */

import { supabase } from '@/lib/supabase';

/**
 * Delete audit logs older than specified days
 * @param daysOld - Number of days to keep (delete everything older)
 * @example deleteOldAuditLogs(30) - Keep only last 30 days
 */
export async function deleteOldAuditLogs(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error, count } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old audit logs:', error);
      return { deleted: 0, error };
    }

    console.log(`✅ Deleted ${count || 0} old audit logs (older than ${daysOld} days)`);
    return { deleted: count || 0, error: null };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { deleted: 0, error };
  }
}

/**
 * Delete notifications older than specified days
 * @param daysOld - Number of days to keep (delete everything older)
 * @example deleteOldNotifications(90) - Keep only last 90 days
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error, count } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old notifications:', error);
      return { deleted: 0, error };
    }

    console.log(`✅ Deleted ${count || 0} old notifications (older than ${daysOld} days)`);
    return { deleted: count || 0, error: null };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { deleted: 0, error };
  }
}

/**
 * Delete read notifications for a specific user older than days
 * Keeps unread notifications to not lose important messages
 */
export async function deleteOldReadNotifications(userId: string, daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error, count } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old read notifications:', error);
      return { deleted: 0, error };
    }

    return { deleted: count || 0, error: null };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { deleted: 0, error };
  }
}

/**
 * Run all cleanup jobs
 * Call this daily via cron job or scheduled function
 */
export async function runAllCleanupJobs() {
  console.log('🧹 Starting database cleanup jobs...');

  const startTime = Date.now();

  // Delete old audit logs (keep 30 days)
  const auditResult = await deleteOldAuditLogs(30);

  // Delete old notifications (keep 90 days)
  const notifResult = await deleteOldNotifications(90);

  const duration = Date.now() - startTime;

  console.log(`✅ Cleanup completed in ${duration}ms`);
  console.log(`   - Deleted ${auditResult.deleted} audit logs`);
  console.log(`   - Deleted ${notifResult.deleted} notifications`);

  return {
    auditLogsDeleted: auditResult.deleted,
    notificationsDeleted: notifResult.deleted,
    duration,
  };
}

/**
 * Get cleanup statistics
 * Shows how much data would be deleted
 */
export async function getCleanupStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Count old audit logs
    const { count: oldAuditLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Count old notifications
    const { count: oldNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', ninetyDaysAgo.toISOString());

    // Count read notifications older than 30 days
    const { count: oldReadNotifs } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo.toISOString());

    return {
      auditLogsOlderThan30Days: oldAuditLogs || 0,
      notificationsOlderThan90Days: oldNotifications || 0,
      readNotificationsOlderThan30Days: oldReadNotifs || 0,
      canCleanup: {
        auditLogs: (oldAuditLogs || 0) > 0,
        notifications: (oldNotifications || 0) > 0,
        readNotifications: (oldReadNotifs || 0) > 0,
      },
    };
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return null;
  }
}
