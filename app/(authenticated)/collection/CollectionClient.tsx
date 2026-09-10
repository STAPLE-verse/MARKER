"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { TabLink, Tabs } from "@/components/ui/Tabs";
import {
  COLLECTION_TABS,
  CollectionTab,
  collectionTabHref,
} from "./collectionTabs";

export interface CollectionSchemaRow {
  id: number;
  title: string;
  status: "Draft" | "Published";
  statusLabel: string;
  date: string;
  /** Where "View" navigates — the owner-authorized draft page, or the public catalog page for the Published tab. */
  href: string;
}

interface CollectionClientProps {
  tab: CollectionTab;
  schemas: CollectionSchemaRow[];
}

const TAB_LABELS: Record<CollectionTab, string> = {
  owned: "Owned",
  archived: "Archived",
  published: "Published",
};

export default function CollectionClient({ tab, schemas }: CollectionClientProps) {
  const columns: ColumnDef<CollectionSchemaRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-bold text-base">{row.original.title}</div>
      ),
    },
    {
      accessorKey: "statusLabel",
      header: "Latest Version",
      cell: ({ row }) => (
        <span
          className={`badge font-mono ${
            row.original.status === "Published" ? "badge-success" : "badge-warning"
          } badge-sm`}
        >
          {row.original.statusLabel}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: tab === "published" ? "Published" : "Last Updated",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={row.original.href}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  const emptyMessage =
    tab === "archived"
      ? "No archived schemas."
      : tab === "published"
        ? "You haven't published any schemas yet."
        : "You haven't created any schemas yet.";

  const searchPlaceholder =
    tab === "archived"
      ? "Search archived schemas..."
      : tab === "published"
        ? "Search published schemas..."
        : "Search my schemas...";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="My Collection"
        description="Manage your metadata templates, draft new forms, or publish them to the Explore archive."
      >
        <Link href="/collection/new">
          <Button variant="primary" size="sm">
            Add schema
          </Button>
        </Link>
      </PageHeader>

      <Tabs className="mt-6">
        {COLLECTION_TABS.map((value) => (
          <TabLink
            key={value}
            href={collectionTabHref(value)}
            active={tab === value}
          >
            {TAB_LABELS[value]}
          </TabLink>
        ))}
      </Tabs>

      <div className="card bg-base-300 shadow-xl border border-base-200 mt-4">
        <div className="card-body p-6">
          <DataTable
            columns={columns}
            data={schemas}
            enablePagination
            enableGlobalSearch
            globalSearchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </div>
  );
}
