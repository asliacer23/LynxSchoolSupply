import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Check, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAsRead, useDeleteNotification, useMarkAllAsRead, useDeleteAllRead } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: notificationsData, isLoading } = useNotifications(100);
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteAllReadMutation = useDeleteAllRead();

  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const notifications = notificationsData?.data ?? [];
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const handleMarkAsRead = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(notificationId);
    }
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteAllRead = () => {
    deleteAllReadMutation.mutate();
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
          {readNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDeleteAllRead}
              disabled={deleteAllReadMutation.isPending}
            >
              Clear read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No notifications yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Notifications will appear here when there are updates about your orders and account
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Unread ({unreadNotifications.length})
              </h2>
              <div className="space-y-2">
                {unreadNotifications.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    isMarkingAsRead={markAsReadMutation.isPending}
                    isDeleting={deleteNotificationMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                Read ({readNotifications.length})
              </h2>
              <div className="space-y-2">
                {readNotifications.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    isMarkingAsRead={markAsReadMutation.isPending}
                    isDeleting={deleteNotificationMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationCardProps {
  notification: any;
  onMarkAsRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead,
  isDeleting,
}: NotificationCardProps) {
  return (
    <Card className={!notification.is_read ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{notification.title}</h3>
              {!notification.is_read && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!notification.is_read && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(notification.id, notification.is_read)}
                disabled={isMarkingAsRead}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Mark read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(notification.id)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
