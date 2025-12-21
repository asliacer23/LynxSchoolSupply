import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getPaymentByOrderId,
  getPayment,
  createPayment,
  updatePaymentStatus,
  getUserPayments,
  getAllPayments,
  getPaymentStats,
  processPayment,
  type PaymentMethod,
} from '../services/payments.service';

/**
 * Hook to get payment for an order
 */
export function usePaymentByOrderId(orderId: string) {
  return useQuery({
    queryKey: ['payment', orderId],
    queryFn: () => getPaymentByOrderId(orderId),
    enabled: !!orderId,
  });
}

/**
 * Hook to get a specific payment
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => getPayment(paymentId),
    enabled: !!paymentId,
  });
}

/**
 * Hook to create a payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      method,
      amount,
      referenceNumber,
      metadata,
    }: {
      orderId: string;
      method: PaymentMethod;
      amount: number;
      referenceNumber?: string;
      metadata?: Record<string, any>;
    }) => createPayment(orderId, method, amount, referenceNumber, metadata),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.orderId] });
    },
  });
}

/**
 * Hook to update payment status
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      status,
      paidAt,
    }: {
      paymentId: string;
      status: string;
      paidAt?: string;
    }) => updatePaymentStatus(paymentId, status as any, paidAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/**
 * Hook to get user's payment history
 */
export function useUserPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', 'user', user?.id],
    queryFn: () => getUserPayments(user?.id || ''),
    enabled: !!user?.id,
  });
}

/**
 * Hook to get all payments (admin)
 */
export function useAllPayments() {
  const { roles } = useAuth();

  return useQuery({
    queryKey: ['payments', 'all'],
    queryFn: () => getAllPayments(roles),
  });
}

/**
 * Hook to get payment statistics
 */
export function usePaymentStats() {
  return useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: getPaymentStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to process a payment
 */
export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: any) => processPayment(vars.paymentId, vars.paymentDetails),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
