import { useQuery } from '@tanstack/react-query';
import {
  getAllAuditLogs,
  getUserAuditLogs,
  getTableAuditLogs,
  getRecordAuditLogs,
  getAuditLogsByDateRange,
  getAuditLogsSummary,
} from '../services/auditLogs.service';

/**
 * Hook to fetch all audit logs
 */
export function useAllAuditLogs(limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['audit-logs', 'all', limit, offset],
    queryFn: () => getAllAuditLogs(limit, offset),
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

/**
 * Hook to fetch audit logs for a specific user
 */
export function useUserAuditLogs(userId: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['audit-logs', 'user', userId, limit, offset],
    queryFn: () => getUserAuditLogs(userId, limit, offset),
    enabled: !!userId,
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

/**
 * Hook to fetch audit logs for a specific table
 */
export function useTableAuditLogs(tableName: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['audit-logs', 'table', tableName, limit, offset],
    queryFn: () => getTableAuditLogs(tableName, limit, offset),
    enabled: !!tableName,
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

/**
 * Hook to fetch audit logs for a specific record
 */
export function useRecordAuditLogs(recordId: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['audit-logs', 'record', recordId, limit, offset],
    queryFn: () => getRecordAuditLogs(recordId, limit, offset),
    enabled: !!recordId,
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

/**
 * Hook to fetch audit logs between dates
 */
export function useAuditLogsByDateRange(startDate: string, endDate: string, limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['audit-logs', 'date-range', startDate, endDate, limit, offset],
    queryFn: () => getAuditLogsByDateRange(startDate, endDate, limit, offset),
    enabled: !!startDate && !!endDate,
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

/**
 * Hook to fetch audit logs summary
 */
export function useAuditLogsSummary() {
  return useQuery({
    queryKey: ['audit-logs', 'summary'],
    queryFn: () => getAuditLogsSummary(),
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}
