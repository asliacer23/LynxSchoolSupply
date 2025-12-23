import { Bell, Trash2, Check, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';

import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useDeleteNotification,
  useMarkAllAsRead,
} from '../hooks/useNotifications';
import '../styles/notification-animations.css';

export function NotificationDropdown() {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications(10);
  const { data: unreadData } = useUnreadCount();

  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notificationList = notifications?.data ?? [];
  const unreadCount = unreadData?.count ?? 0;

  /* ============================================================
     MOBILE – FULL SCREEN BOTTOM SHEET
  ============================================================ */
  const MobileSheet = (
    <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative sm:hidden transition-all duration-200 hover:bg-muted/80 active:scale-95"
        >
          <Bell className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-semibold animate-pulse shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-2xl p-0 flex flex-col animate-in slide-in-from-bottom-full duration-300"
      >
        {/* Header - Just title */}
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
        </SheetHeader>

        {/* Mark All Button - Separate section */}
        {unreadCount > 0 && (
          <div className="border-b px-4 py-2 shrink-0 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="w-full text-xs h-7 transition-all duration-200 hover:bg-muted active:scale-95"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Check className="h-3 w-3 mr-2" />
              )}
              Mark all as read
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-60" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : notificationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground text-center">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificationList.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`px-3 py-3 transition-all duration-300 animate-in fade-in ${
                    !notification.is_read ? 'bg-muted/50' : ''
                  } hover:bg-muted/40`}
                  style={{
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <div className="flex justify-between gap-2">
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate flex-1">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            markAsReadMutation.mutate(notification.id)
                          }
                          disabled={markAsReadMutation.isPending}
                          className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition-all duration-200 active:scale-90"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-90"
                        onClick={() =>
                          deleteNotificationMutation.mutate(notification.id)
                        }
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Link to full notifications page */}
        {notificationList.length > 0 && (
          <div className="border-t bg-muted/30 px-4 py-2.5 shrink-0">
            <Link
              to="/notifications"
              onClick={() => setMobileSheetOpen(false)}
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 transition-colors"
            >
              View all notifications
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );

  /* ============================================================
     DESKTOP – DROPDOWN MENU
  ============================================================ */
  const DesktopDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden sm:flex transition-all duration-200 hover:bg-muted/80 active:scale-95"
        >
          <Bell className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-semibold animate-pulse shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 max-h-[500px] overflow-y-auto p-0 rounded-lg border shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-3 py-2.5 bg-background">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</h3>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs h-6 px-2 transition-all duration-200 hover:bg-muted active:scale-95"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Mark all
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-60" />
          </div>
        ) : notificationList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-1">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notificationList.map((notification, index) => (
              <div
                key={notification.id}
                className={`px-3 py-2 transition-all duration-300 animate-in fade-in ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/30'
                }`}
                style={{
                  animationDelay: `${index * 25}ms`
                }}
              >
                <div className="flex justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate flex-1">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-snug">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60 text-right">
                      {formatDistanceToNow(
                        new Date(notification.created_at),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0 pt-0.5">
                    {!notification.is_read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          markAsReadMutation.mutate(notification.id)
                        }
                        disabled={markAsReadMutation.isPending}
                        className="h-6 w-6 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 active:scale-90 rounded"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-90 rounded"
                      onClick={() =>
                        deleteNotificationMutation.mutate(notification.id)
                      }
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer - Link to full page */}
        {notificationList.length > 0 && (
          <>
            <div className="border-t" />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="block px-3 py-2 text-xs font-semibold text-primary hover:bg-muted transition-colors text-center cursor-pointer"
              >
                View all
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {MobileSheet}
      {DesktopDropdown}
    </>
  );
}
