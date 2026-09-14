"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { runAction } from "@/lib/action";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { setNotificationRead } from "@/features/notifications/actions/setNotificationRead";
import { broadcastNotificationsChanged } from "@/features/notifications/utils/notificationEvents";
import { NotificationListItemDTO } from "@/features/notifications/types";

interface DashboardNotificationsCardProps {
  notifications: NotificationListItemDTO[];
}

/**
 * A "use client" island rather than plain server-rendered rows — the
 * dashboard page itself is a Server Component, which can't attach an
 * onClick. Without this, clicking a notification here just navigates via
 * the Link's href and never marks it read, unlike the bell dropdown and the
 * full `/notifications` table, which both mark-as-read on click.
 */
export function DashboardNotificationsCard({ notifications: initialNotifications }: DashboardNotificationsCardProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();

  const handleOpen = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await runAction(setNotificationRead({ notificationId: id, read: true }));
      broadcastNotificationsChanged();
    });
  };

  if (notifications.length === 0) {
    return <p className="py-8 text-center text-base-content/70">You&apos;re all caught up.</p>;
  }

  return (
    <div className="divide-y divide-base-300">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.routeData?.path ?? "/notifications"}
          onClick={() => handleOpen(notification.id)}
          className="py-4 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-base-200/50 -mx-2 px-2 rounded transition-colors"
        >
          <span className="text-base-content/80">{notification.message}</span>
          <span className="text-xs text-base-content/50 shrink-0 ml-4">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}
