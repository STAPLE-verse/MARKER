"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormStudio } from "@/features/form-builder";
import { saveFormVersion } from "@/features/forms/mutations/saveFormVersion";
import { createFormCheckpoint } from "@/features/forms/mutations/createFormCheckpoint";

interface SchemaEditClientProps {
  formId: number;
  initialSchema: Record<string, unknown>;
  initialUiSchema: Record<string, unknown>;
}

export default function SchemaEditClient({ formId, initialSchema, initialUiSchema }: SchemaEditClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleAutoSave = async (state: { schema: object; uiSchema: object; formData: object }) => {
    await saveFormVersion({
      formId,
      schema: state.schema,
      uiSchema: state.uiSchema,
    });
  };

  const handleSaveCheckpoint = async (state: { schema: object; uiSchema: object; formData: object }) => {
    try {
      setIsSaving(true);
      await createFormCheckpoint({
        formId,
        schema: state.schema,
        uiSchema: state.uiSchema,
      });
      router.push(`/collection/${formId}`);
    } catch (error) {
      console.error("Failed to save schema checkpoint:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300 h-screen flex flex-col">
      <div className="mb-4 flex-none">
        <Button variant="ghost" onClick={() => router.back()} size="sm">
          ← Back
        </Button>
      </div>

      <div className="flex-none">
        <PageHeader
          title="Schema Form Studio"
          description="Design, edit, and preview your metadata template schema all in one place. Changes are saved as a draft version."
        >
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.back()} size="sm" disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="flex-1 w-full min-h-0 border border-base-300 p-6 rounded-box bg-base-200/50 shadow-inner overflow-hidden">
        <FormStudio
          initialSchema={initialSchema}
          initialUiSchema={initialUiSchema}
          onAutoSave={handleAutoSave}
          onSaveCheckpoint={handleSaveCheckpoint}
        />
      </div>
    </div>
  );
}
