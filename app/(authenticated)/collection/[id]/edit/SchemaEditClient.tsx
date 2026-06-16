"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormStudio } from "@/features/form-builder";
import { saveFormVersion } from "@/features/forms/mutations/saveFormVersion";
import { createFormCheckpoint } from "@/features/forms/mutations/createFormCheckpoint";
import { Alert } from "@/components/ui/Alert";
import { useFormDraft } from "@/features/forms/hooks/useFormDraft";

interface SchemaEditClientProps {
  formId: number;
  initialSchema: Record<string, unknown>;
  initialUiSchema: Record<string, unknown>;
}

export default function SchemaEditClient({ formId, initialSchema, initialUiSchema }: SchemaEditClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    draftLoaded,
    draftToRestore,
    currentSchema,
    currentUiSchema,
    studioKey,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft
  } = useFormDraft(formId, initialSchema, initialUiSchema);

  const handleAutoSave = (state: { schema: object; uiSchema: object; formData: object }) => {
    saveDraft(state.schema, state.uiSchema);
  };

  const handleSave = async (state: { schema: object; uiSchema: object; formData: object }) => {
    try {
      setIsSaving(true);
      await saveFormVersion({
        formId,
        schema: state.schema,
        uiSchema: state.uiSchema,
      });
      clearDraft();
      router.push(`/collection/${formId}`);
    } catch (error) {
      console.error("Failed to save schema:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewVersion = async (state: { schema: object; uiSchema: object; formData: object }) => {
    try {
      setIsSaving(true);
      await createFormCheckpoint({
        formId,
        schema: state.schema,
        uiSchema: state.uiSchema,
      });
      clearDraft();
      router.push(`/collection/${formId}`);
    } catch (error) {
      console.error("Failed to save schema as new version:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!draftLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

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
          description="Design, edit, and preview your metadata template schema all in one place. Auto-saves locally to your browser."
        >
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.back()} size="sm" disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </PageHeader>
      </div>
      
      {draftToRestore && (
        <div className="flex-none mb-4">
          <Alert variant="info" showIcon>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
              <div className="text-sm font-medium">
                We found unsaved changes in your browser from a previous session.
                {draftToRestore.timestamp && (
                  <span className="opacity-75 block sm:inline sm:ml-1 font-normal">
                    (Last edited: {new Date(draftToRestore.timestamp).toLocaleString()})
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={discardDraft}>
                  Discard
                </Button>
                <Button size="sm" variant="primary" onClick={restoreDraft}>
                  Restore Draft
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex-1 w-full min-h-0 border border-base-300 p-6 rounded-box bg-base-200/50 shadow-inner overflow-hidden relative">
        {isSaving && (
          <div className="absolute inset-0 z-50 bg-base-100/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300">
              <span className="loading loading-spinner text-primary"></span>
              <span className="font-medium">Saving to database...</span>
            </div>
          </div>
        )}
        <FormStudio
          key={studioKey}
          initialSchema={currentSchema}
          initialUiSchema={currentUiSchema}
          onAutoSave={handleAutoSave}
          onSave={handleSave}
          onSaveNewVersion={handleSaveNewVersion}
        />
      </div>
    </div>
  );
}
