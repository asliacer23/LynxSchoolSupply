import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Check, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useMarkAsRead,
  useDeleteNotification,
  useMarkAllAsRead,
  useDeleteAllRead,
} from '../hooks/useNotifications';
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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const notifications = notificationsData?.data ?? [];
  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Notifications</h1>

        <div className="flex flex-wrap gap-2">
          {unread.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="w-full sm:w-auto"
            >
              Mark all as read
            </Button>
          )}
          {read.length > 0 && (
            <Button
              variant="outline"
              onClick={() => deleteAllReadMutation.mutate()}
              disabled={deleteAllReadMutation.isPending}
              className="w-full sm:w-auto"
            >
              Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 opacity-50 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No notifications yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You’ll see updates about your account and orders here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <Section title={`Unread (${unread.length})`} dot>
              {unread.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onMarkAsRead={() => markAsReadMutation.mutate(n.id)}
                  onDelete={() => deleteNotificationMutation.mutate(n.id)}
                  isMarking={markAsReadMutation.isPending}
                  isDeleting={deleteNotificationMutation.isPending}
                />
              ))}
            </Section>
          )}

          {read.length > 0 && (
            <Section title={`Read (${read.length})`} muted>
              {read.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onDelete={() => deleteNotificationMutation.mutate(n.id)}
                  isDeleting={deleteNotificationMutation.isPending}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Components ----------------------------- */

function Section({
  title,
  dot,
  muted,
  children,
}: {
  title: string;
  dot?: boolean;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2
        className={`flex items-center gap-2 text-sm font-semibold ${
          muted ? 'text-muted-foreground' : ''
        }`}
      >
        {dot && <span className="h-2 w-2 rounded-full bg-foreground" />}
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  isMarking,
  isDeleting,
}: {
  notification: any;
  onMarkAsRead?: () => void;
  onDelete: () => void;
  isMarking?: boolean;
  isDeleting?: boolean;
}) {
  return (
    <Card
      className={
        !notification.is_read
          ? 'border-foreground/20 bg-muted'
          : ''
      }
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Content */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-semibold">{notification.title}</h3>
              {!notification.is_read && (
                <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-xs font-medium">
                  New
                </span>
              )}
            </div>

            <p className="mb-2 text-sm text-muted-foreground">
              {notification.message}
            </p>

            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
            {!notification.is_read && onMarkAsRead && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAsRead}
                disabled={isMarking}
                className="w-full sm:w-auto"
              >
                <Check className="mr-2 h-4 w-4 sm:mr-0" />
                <span className="sm:hidden">Mark as read</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={isDeleting}
              className="w-full text-destructive sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4 sm:mr-0" />
              <span className="sm:hidden">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
