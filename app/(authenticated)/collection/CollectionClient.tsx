"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export interface CollectionSchemaRow {
  id: number;
  title: string;
  status: "Draft" | "Published";
  statusLabel: string;
  updatedAt: string;
}

interface CollectionClientProps {
  schemas: CollectionSchemaRow[];
}

export default function CollectionClient({ schemas }: CollectionClientProps) {
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
      accessorKey: "updatedAt",
      header: "Last Updated",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/collection/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="My Collection"
        description="Manage your metadata templates, draft new forms, or publish them to the Explore archive."
      >
        <Link href="/collection/new">
          <Button variant="primary" size="sm">
            Create Schema
          </Button>
        </Link>
      </PageHeader>

      <div className="card bg-base-300 shadow-xl border border-base-200 mt-6">
        <div className="card-body p-6">
          <DataTable
            columns={columns}
            data={schemas}
            enablePagination
            enableGlobalSearch
            globalSearchPlaceholder="Search my schemas..."
            emptyMessage="You haven't created any schemas yet."
          />
        </div>
      </div>
    </div>
  );
}
