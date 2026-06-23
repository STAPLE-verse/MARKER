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
      formName={latestVersion.name || "Untitled Form"}
      formVersion={latestVersion.version}
      totalVersions={form.versions.length}
      initialSchema={latestVersion.schema} 
      initialUiSchema={latestVersion.uiSchema} 
    />
  );
}
