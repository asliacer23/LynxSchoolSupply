import { useQuery } from '@tanstack/react-query';
import {
  getAllOrders,
  getOrderDetails,
  getOrderItems,
  getOrderPayment,
  getAllPayments,
  calculateOrderStats,
  getOrdersByCashier,
  getOrdersByDateRange,
} from './service';

/**
 * Hook to fetch all orders
 */
export function useAllOrders() {
  return useQuery({
    queryKey: ['orders-management', 'all-orders'],
    queryFn: async () => {
      const { data, error } = await getAllOrders();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch single order details
 */
export function useOrderDetails(orderId: string) {
  return useQuery({
    queryKey: ['orders-management', 'order-details', orderId],
    queryFn: async () => {
      const { data, error } = await getOrderDetails(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch order items
 */
export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['orders-management', 'order-items', orderId],
    queryFn: async () => {
      const { data, error } = await getOrderItems(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch order payment
 */
export function useOrderPayment(orderId: string) {
  return useQuery({
    queryKey: ['orders-management', 'order-payment', orderId],
    queryFn: async () => {
      const { data, error } = await getOrderPayment(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch all payments
 */
export function useAllPayments() {
  return useQuery({
    queryKey: ['orders-management', 'all-payments'],
    queryFn: async () => {
      const { data, error } = await getAllPayments();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to calculate order statistics
 */
export function useOrderStats() {
  return useQuery({
    queryKey: ['orders-management', 'stats'],
    queryFn: async () => {
      const { data, error } = await calculateOrderStats();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch orders by cashier
 */
export function useOrdersByCashier(cashierId: string) {
  return useQuery({
    queryKey: ['orders-management', 'orders-by-cashier', cashierId],
    queryFn: async () => {
      const { data, error } = await getOrdersByCashier(cashierId);
      if (error) throw error;
      return data;
    },
    enabled: !!cashierId,
  });
}

/**
 * Hook to fetch orders by date range
 */
export function useOrdersByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['orders-management', 'orders-by-date', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await getOrdersByDateRange(startDate, endDate);
      if (error) throw error;
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}
