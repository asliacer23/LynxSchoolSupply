import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  subscribeToNotifications,
} from './service';
import { useEffect } from 'react';

/**
 * Hook to get user notifications
 */
export function useNotifications(limit: number = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getUserNotifications(user?.id || '', limit),
    enabled: !!user?.id,
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => getUnreadCount(user?.id || ''),
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Keep fresh via real-time subscription only
  });

  // Subscribe to real-time updates with reconnection logic
  useEffect(() => {
    if (!user?.id) return;

    let subscription: any;
    let reconnectTimeout: NodeJS.Timeout;
    let isSubscribed = true;

    const setupSubscription = () => {
      if (!isSubscribed) return;

      subscription = subscribeToNotifications(user.id, (notification) => {
        if (!isSubscribed) return;
        
        // Clear reconnect timeout on successful message
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        
        // Invalidate queries on new notification
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user.id] });
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      });

      // Set reconnect timeout (reconnect if no message for 30s)
      reconnectTimeout = setTimeout(() => {
        console.warn('Notification subscription lost, reconnecting...');
        subscription?.unsubscribe();
        setupSubscription();
      }, 30000);
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user?.id, queryClient]);

  return query;
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
    },
  });
}

/**
 * Hook to mark all as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => markAllAsRead(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
    },
  });
}

/**
 * Hook to delete all read notifications
 */
export function useDeleteAllRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => deleteAllRead(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
    },
  });
}
