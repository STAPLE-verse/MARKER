"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import Link from "next/link";
import { deleteForm } from "@/features/forms/actions";

export interface CollectionSchemaRow {
  id: number;
  title: string;
  type: "Draft" | "Published";
  version: number;
  updatedAt: string;
}

interface CollectionClientProps {
  schemas: CollectionSchemaRow[];
}

export default function CollectionClient({ schemas }: CollectionClientProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<CollectionSchemaRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedSchema) return;
    try {
      setIsDeleting(true);
      await deleteForm({ formId: selectedSchema.id });
      setDeleteModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<CollectionSchemaRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-bold text-base">{row.original.title}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`badge ${
            row.original.type === "Published" ? "badge-success" : "badge-warning"
          } badge-sm`}
        >
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => <span className="font-mono">v{row.original.version}</span>,
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link href={`/collection/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          {row.original.type === "Draft" && (
            <Link href={`/collection/${row.original.id}/edit`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:bg-error/15"
            onClick={() => {
              setSelectedSchema(row.original);
              setDeleteModalOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
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

      <Modal
        open={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        title="Delete Metadata Schema"
      >
        <div className="py-4">
          <p className="text-base-content/85">
            Are you sure you want to delete <span className="font-bold text-primary">{selectedSchema?.title}</span>? This action cannot be undone.
          </p>
        </div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Schema"}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
