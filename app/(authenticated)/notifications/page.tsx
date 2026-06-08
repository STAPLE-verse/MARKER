"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

interface NotificationRow {
  id: number;
  message: string;
  announcement: boolean;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([
    {
      id: 1,
      message: "Dr. Jane Doe published a new version of Cognitive Assessment Template (v1.1.0)",
      announcement: false,
      read: false,
      createdAt: "2 hours ago",
    },
    {
      id: 2,
      message: "System maintenance scheduled for Sunday, June 7th, 02:00-04:00 UTC.",
      announcement: true,
      read: false,
      createdAt: "1 day ago",
    },
    {
      id: 3,
      message: "Your schema 'Sleep Quality Questionnaire' was successfully imported from STAPLE.",
      announcement: false,
      read: true,
      createdAt: "3 days ago",
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const columns: ColumnDef<NotificationRow>[] = [
    {
      accessorKey: "message",
      header: "Notification",
      cell: ({ row }) => (
        <div className={row.original.read ? "text-base-content/50" : "font-medium text-base-content"}>
          {row.original.message}
        </div>
      ),
    },
    {
      accessorKey: "announcement",
      header: "Type",
      cell: ({ row }) => (
        <span
          className={`badge ${
            row.original.announcement ? "badge-secondary" : "badge-ghost"
          } badge-sm`}
        >
          {row.original.announcement ? "Announcement" : "Activity"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Received",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          {!row.original.read && (
            <Button variant="ghost" size="sm" onClick={() => markAsRead(row.original.id)}>
              Mark as Read
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Notifications"
        description="Stay updated with activities in your templates and system announcements."
      >
        {notifications.some((n) => !n.read) && (
          <Button
            variant="primary"
            outline
            size="sm"
            onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
          >
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
