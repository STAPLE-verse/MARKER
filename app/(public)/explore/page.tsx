"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PublishedSchemaRow {
  pid: string;
  title: string;
  description: string;
  version: string;
  author: string;
  license: string;
  keywords: string[];
}

const columns: ColumnDef<PublishedSchemaRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div>
        <div className="font-bold text-base">{row.original.title}</div>
        <div className="text-xs text-base-content/60 max-w-md truncate">
          {row.original.description}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => (
      <span className="badge badge-secondary badge-outline font-mono">
        v{row.original.version}
      </span>
    ),
  },
  {
    accessorKey: "author",
    header: "Author",
  },
  {
    accessorKey: "license",
    header: "License",
    cell: ({ row }) => (
      <span className="badge badge-accent badge-sm">{row.original.license}</span>
    ),
  },
  {
    accessorKey: "keywords",
    header: "Keywords",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.keywords.map((kw) => (
          <span key={kw} className="badge badge-ghost badge-xs">
            {kw}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/schemas/${row.original.pid}`}>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </Link>
    ),
  },
];

const mockPublishedSchemas: PublishedSchemaRow[] = [
  {
    pid: "ps_cognitive_assessment",
    title: "Cognitive Assessment Template",
    description: "Standard cognitive test protocol including memory recall, verbal fluency, and executive function mapping.",
    version: "1.0.0",
    author: "Dr. Jane Doe",
    license: "CC-BY-4.0",
    keywords: ["cognitive", "psychology", "assessment"],
  },
  {
    pid: "ps_patient_demographics",
    title: "Patient Demographics Form",
    description: "Universal template for gathering baseline patient metadata, mapped to HL7 FHIR standards.",
    version: "2.1.0",
    author: "Clinical Data Initiative",
    license: "CC0-1.0",
    keywords: ["demographics", "clinical", "fhir"],
  },
  {
    pid: "ps_eeg_metadata",
    title: "EEG Recording Log",
    description: "Metadata descriptors for electroencephalography recording sessions, including electrode layout and sampling parameters.",
    version: "1.2.0",
    author: "Neuroscience Lab",
    license: "MIT",
    keywords: ["eeg", "neuroscience", "metadata"],
  },
];

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Explore Public Schemas"
        description="Search, view, and reuse standardized metadata templates published by the community."
      />

      <div className="card bg-base-300 shadow-xl border border-base-200 mt-6">
        <div className="card-body p-6">
          <DataTable
            columns={columns}
            data={mockPublishedSchemas}
            enablePagination
            enableGlobalSearch
            globalSearchPlaceholder="Search titles, descriptions, keywords..."
            emptyMessage="No public schemas found matching your search."
          />
        </div>
      </div>
    </div>
  );
}
