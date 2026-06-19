import React from "react";
import { notFound } from "next/navigation";
import { requirePageAuth } from "@/utils/auth";
import { getFormById } from "@/features/forms/queries/getFormById";
import SchemaEditClient from "./SchemaEditClient";

export default async function SchemaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requirePageAuth();

  const resolvedParams = await params;
  const formId = parseInt(resolvedParams.id, 10);
  if (isNaN(formId)) return notFound();

  const form = await getFormById(formId, userId);
  if (!form || form.versions.length === 0) return notFound();

  const latestVersion = form.versions[0];

  return (
    <SchemaEditClient 
      formId={form.id} 
      formName={latestVersion.name || "Untitled Form"}
      formVersion={latestVersion.version}
      totalVersions={form.versions.length}
      initialSchema={(latestVersion.schema || {}) as Record<string, unknown>} 
      initialUiSchema={(latestVersion.uiSchema || {}) as Record<string, unknown>} 
    />
  );
}
