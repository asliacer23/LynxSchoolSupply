/**
 * Centralized refresh utilities for managing real-time data updates
 * Provides functions to invalidate and refetch specific query caches
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryRefreshers(queryClient: QueryClient) {
  return {
    // Profile refreshers
    refreshProfile: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
    },

    // Cart refreshers
    refreshCart: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },

    // Order refreshers
    refreshOrders: (userId?: string) => {
      queryClient.invalidateQueries({ queryKey: ['orders', userId] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },

    refreshOrderStatus: (orderId: string) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },

    // Product refreshers
    refreshProducts: (categoryId?: string) => {
      queryClient.invalidateQueries({ queryKey: ['products', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },

    refreshProductDetail: (productId: string) => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },

    // Notification refreshers
    refreshNotifications: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
    },

    // Payment refreshers
    refreshPayments: (userId?: string) => {
      queryClient.invalidateQueries({ queryKey: ['payments', userId] });
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },

    // Audit log refreshers
    refreshAuditLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },

    // Category refreshers
    refreshCategories: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },

    // Global refreshers
    refreshAll: () => {
      queryClient.invalidateQueries();
    },

    refreshDashboard: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  };
}

export type QueryRefreshers = ReturnType<typeof createQueryRefreshers>;
