import React from "react";
import { loadOwnedForm } from "@/features/forms/queries";
import SchemaEditClient from "./SchemaEditClient";

export default async function SchemaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { form } = await loadOwnedForm(id);

  const latestVersion = form.versions[0];

  return (
    <SchemaEditClient 
      formId={form.id} 
      totalVersions={form.versions.length}
      version={latestVersion}
    />
  );
}
