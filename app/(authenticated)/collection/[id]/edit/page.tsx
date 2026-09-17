import React from "react";
import { redirect } from "next/navigation";
import { loadOwnedForm } from "@/features/forms/queries";
import { canEditForm } from "@/features/forms/utils/formPermissions";
import SchemaEditClient from "./SchemaEditClient";

export default async function SchemaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { form } = await loadOwnedForm(id);

  // The builder UI (@staple-verse/form-studio's FormStudioUI) has no
  // read-only mode of its own (docs/refactor/form-collaboration.md §4.6) —
  // a VIEWER's read access to the structure stays on the detail page's
  // SchemaViewerCard instead. Hiding the "Edit Structure" link isn't enough
  // on its own; this closes the direct-URL path too.
  if (!canEditForm(form)) {
    redirect(`/collection/${form.id}`);
  }

  const latestVersion = form.versions[0];

  return (
    <SchemaEditClient 
      formId={form.id} 
      version={latestVersion}
    />
  );
}
