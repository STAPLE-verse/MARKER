"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { runAction } from "@/lib/action";
import { setNotificationRead } from "@/features/notifications/actions/setNotificationRead";
import { markAllNotificationsRead } from "@/features/notifications/actions/markAllNotificationsRead";
import { deleteNotification } from "@/features/notifications/actions/deleteNotification";
import { broadcastNotificationsChanged } from "@/features/notifications/utils/notificationEvents";
import { NotificationListItemDTO } from "@/features/notifications/types";

interface NotificationsClientProps {
  notifications: NotificationListItemDTO[];
}

export default function NotificationsClient({ notifications: initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    startTransition(async () => {
      await runAction(setNotificationRead({ notificationId: id, read: true }));
      broadcastNotificationsChanged();
    });
  };

  const toggleRead = (id: number, currentlyRead: boolean) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !currentlyRead } : n)));
    startTransition(async () => {
      await runAction(setNotificationRead({ notificationId: id, read: !currentlyRead }));
      broadcastNotificationsChanged();
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await runAction(markAllNotificationsRead({}));
      broadcastNotificationsChanged();
    });
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await runAction(deleteNotification({ notificationId: id }));
      broadcastNotificationsChanged();
    });
  };

  const columns: ColumnDef<NotificationListItemDTO>[] = [
    {
      accessorKey: "message",
      header: "Notification",
      cell: ({ row }) => {
        const label = (
          <span className={row.original.read ? "text-base-content/50" : "font-medium text-base-content"}>
            {row.original.message}
          </span>
        );
        return row.original.routeData ? (
          <Link
            href={row.original.routeData.path}
            className="hover:underline"
            onClick={() => !row.original.read && markAsRead(row.original.id)}
          >
            {label}
          </Link>
        ) : (
          label
        );
      },
    },
    {
      accessorKey: "announcement",
      header: "Type",
      cell: ({ row }) => (
        <span className={`badge ${row.original.announcement ? "badge-secondary" : "badge-ghost"} badge-sm`}>
          {row.original.announcement ? "Announcement" : "Activity"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Received",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <span className="tooltip" data-tip={row.original.read ? "Mark as unread" : "Mark as read"}>
            <Button
              variant="ghost"
              size="xs"
              className="shrink-0 transition-transform duration-150 hover:scale-110"
              aria-label={row.original.read ? "Mark as unread" : "Mark as read"}
              onClick={() => toggleRead(row.original.id, row.original.read)}
            >
              {row.original.read ? (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeSlashIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              )}
            </Button>
          </span>
          <span className="tooltip" data-tip="Delete notification">
            <ConfirmActionButton
              triggerLabel={<TrashIcon className="h-5 w-5" aria-hidden="true" />}
              triggerVariant="ghost"
              triggerSize="xs"
              triggerClassName="text-error hover:bg-error/15 shrink-0 transition-transform duration-150 hover:scale-110"
              triggerAriaLabel="Delete notification"
              modalTitle="Delete Notification"
              modalBody={
                <p className="text-base-content/85">
                  This notification will be permanently deleted. This action cannot be undone.
                </p>
              }
              confirmLabel="Delete Notification"
              pendingLabel="Deleting..."
              confirmClassName="btn-error"
              isPending={isPending}
              onConfirm={() => handleDelete(row.original.id)}
            />
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader title="Notifications" description="Stay updated on activity related to your schemas.">
        {notifications.some((n) => !n.read) && (
          <Button variant="primary" outline size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </PageHeader>

      <div className="card bg-base-300 shadow-xl border border-base-200 mt-6">
        <div className="card-body p-6">
          <DataTable
            columns={columns}
            data={notifications}
            enablePagination
            enableGlobalSearch={false}
            emptyMessage="You have no notifications."
          />
        </div>
      </div>
    </div>
  );
}
