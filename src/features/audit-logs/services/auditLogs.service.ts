import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types/database';

/**
 * Create an audit log entry
 * Called automatically when users perform actions
 */
export async function createAuditLog(
  userId: string,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, any>
) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        table_name: tableName,
        record_id: recordId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return { data: null, error };
    }

    return { data: data as AuditLog, error: null };
  } catch (error) {
    console.error('Audit log error:', error);
    return { data: null, error };
  }
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(limit = 100, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, metadata, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { data: null, count: 0, error };
    }

    return { data: data as AuditLog[] | null, count: count || 0, error: null };
  } catch (error) {
    console.error('Audit logs error:', error);
    return { data: null, count: 0, error };
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit = 50, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, metadata, created_at', {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user audit logs:', error);
      return { data: null, count: 0, error };
    }

    return { data: data as AuditLog[] | null, count: count || 0, error: null };
  } catch (error) {
    console.error('User audit logs error:', error);
    return { data: null, count: 0, error };
  }
}

/**
 * Get audit logs for a specific table
 */
export async function getTableAuditLogs(tableName: string, limit = 50, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, metadata, created_at', {
        count: 'exact',
      })
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching table audit logs:', error);
      return { data: null, count: 0, error };
    }

    return { data: data as AuditLog[] | null, count: count || 0, error: null };
  } catch (error) {
    console.error('Table audit logs error:', error);
    return { data: null, count: 0, error };
  }
}

/**
 * Get audit logs for a specific record
 */
export async function getRecordAuditLogs(recordId: string, limit = 50, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, metadata, created_at', {
        count: 'exact',
      })
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching record audit logs:', error);
      return { data: null, count: 0, error };
    }

    return { data: data as AuditLog[] | null, count: count || 0, error: null };
  } catch (error) {
    console.error('Record audit logs error:', error);
    return { data: null, count: 0, error };
  }
}

/**
 * Get audit logs between dates
 */
export async function getAuditLogsByDateRange(
  startDate: string,
  endDate: string,
  limit = 100,
  offset = 0
) {
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, metadata, created_at', {
        count: 'exact',
      })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit logs by date:', error);
      return { data: null, count: 0, error };
    }

    return { data: data as AuditLog[] | null, count: count || 0, error: null };
  } catch (error) {
    console.error('Date range audit logs error:', error);
    return { data: null, count: 0, error };
  }
}

/**
 * Get audit logs summary (count by action)
 */
export async function getAuditLogsSummary() {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action');

    if (error) {
      console.error('Error fetching audit logs summary:', error);
      return { data: null, error };
    }

    const summary: Record<string, number> = {};
    (data || []).forEach((log: any) => {
      summary[log.action] = (summary[log.action] || 0) + 1;
    });

    return { data: summary, error: null };
  } catch (error) {
    console.error('Audit logs summary error:', error);
    return { data: null, error };
  }
}

/**
 * Delete old audit logs (older than X days)
 * Admin only
 */
export async function deleteOldAuditLogs(daysOld: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateStr = cutoffDate.toISOString();

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDateStr);

    if (error) {
      console.error('Error deleting old audit logs:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete audit logs error:', error);
    return { error };
  }
}
