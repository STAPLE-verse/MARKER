"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { runAction } from "@/lib/action";
import { getNotificationBellData } from "@/features/notifications/actions/getNotificationBellData";
import { setNotificationRead } from "@/features/notifications/actions/setNotificationRead";
import { broadcastNotificationsChanged, onNotificationsChanged } from "@/features/notifications/utils/notificationEvents";
import { NotificationListItemDTO } from "@/features/notifications/types";

const POLL_INTERVAL_MS = 60_000;

interface NotificationBellProps {
  initialUnreadCount: number;
  initialLatest: NotificationListItemDTO[];
}

export function NotificationBell({ initialUnreadCount, initialLatest }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [latest, setLatest] = useState(initialLatest);
  const [, startTransition] = useTransition();

  // STAPLE's bell has no refresh path at all — it only updates on mount or
  // after a mark-as-read call you personally made. Most notifications come
  // from other users' actions, so a light poll is a real improvement, not
  // just parity: it's the only way the count ever moves without you doing
  // something yourself.
  //
  // The poll only runs while the tab is actually visible, and refreshes
  // immediately the moment it becomes visible again — otherwise a
  // backgrounded tab keeps polling for nothing, and a tab you just switched
  // back to could show a stale badge for up to POLL_INTERVAL_MS.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const refresh = () => {
      startTransition(async () => {
        const res = await runAction(getNotificationBellData({}));
        if (res.ok) {
          setUnreadCount(res.data.unreadCount);
          setLatest(res.data.latest);
        }
      });
    };

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(refresh, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      clearInterval(interval);
      interval = undefined;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // The bell and the full `/notifications` table are separate components
    // with no shared state — a toggle/delete/mark-all-read there wouldn't
    // otherwise reach the bell until the next poll tick (up to a minute).
    const unsubscribe = onNotificationsChanged(refresh);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
    };
  }, []);

  const handleOpenNotification = (notification: NotificationListItemDTO) => {
    setLatest((prev) => prev.filter((n) => n.id !== notification.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      await runAction(setNotificationRead({ notificationId: notification.id, read: true }));
      broadcastNotificationsChanged();
    });
  };

  return (
    <Dropdown position="end">
      <DropdownTrigger className="btn btn-ghost btn-sm">
        <div className={unreadCount > 0 ? "indicator" : ""}>
          {unreadCount > 0 && (
            <Badge size="xs" variant="primary" className="indicator-item indicator-top indicator-end">
              {unreadCount}
            </Badge>
          )}
          <BellIcon className="w-5 h-5" />
        </div>
      </DropdownTrigger>
      <DropdownContent className="w-80 mt-4 right-0 origin-top-right">
        {latest.length === 0 ? (
          <DropdownItem className="text-sm text-base-content/60 px-2 py-2">No new notifications.</DropdownItem>
        ) : (
          latest.map((notification) => (
            <DropdownItem key={notification.id}>
              <Link
                href={notification.routeData?.path ?? "/notifications"}
                onClick={() => handleOpenNotification(notification)}
                className="whitespace-normal text-sm"
              >
                {notification.message}
              </Link>
            </DropdownItem>
          ))
        )}
        <DropdownItem className="border-t border-base-200 mt-1 pt-1">
          <Link href="/notifications" className="text-sm font-medium">
            View all notifications
          </Link>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
