"use client";

import { useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { StapleImportModal } from "./StapleImportModal";
import type { StapleImportFormDTO } from "@/features/forms/imports/queries/getStapleImportOptions";

interface StapleImportTableProps {
  forms: StapleImportFormDTO[];
}

/**
 * One row per STAPLE form (not per version) — same `DataTable` primitive
 * `CollectionClient.tsx` uses for `/collection`. Clicking "Import" opens
 * `StapleImportModal` for the version/destination choice.
 */
export function StapleImportTable({ forms }: StapleImportTableProps) {
  const [activeForm, setActiveForm] = useState<StapleImportFormDTO | null>(null);

  const columns: ColumnDef<StapleImportFormDTO>[] = [
    {
      accessorKey: "latestName",
      header: "Title",
      cell: ({ row }) => <div className="font-bold text-base">{row.original.latestName}</div>,
    },
    {
      id: "latestVersion",
      header: "Latest STAPLE version",
      cell: ({ row }) => `v${row.original.versions[0]?.version ?? "?"}`,
    },
    {
      id: "updatedAt",
      header: "Last updated",
      cell: ({ row }) =>
        row.original.versions[0]
          ? new Date(row.original.versions[0].createdAt).toLocaleDateString()
          : "—",
    },
    {
      id: "markerStatus",
      header: "MARKER status",
      cell: ({ row }) => {
        const count = row.original.markerTargets.length;
        if (count === 0) {
          return <span className="badge badge-ghost badge-sm">Not imported</span>;
        }
        return (
          <span className="badge badge-info badge-sm">
            {count === 1 ? "Already imported" : `${count} MARKER copies`}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setActiveForm(row.original)}>
          Import
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={forms}
        enableGlobalSearch
        enablePagination
        globalSearchPlaceholder="Search STAPLE forms..."
        emptyMessage="No importable STAPLE forms yet."
      />
      {activeForm && (
        <StapleImportModal form={activeForm} open onClose={() => setActiveForm(null)} />
      )}
    </>
  );
}
