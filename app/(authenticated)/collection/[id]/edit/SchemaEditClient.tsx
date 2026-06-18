"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormStudioProvider, FormStudioUI, useFormStudio } from "@/features/form-builder";
import { saveFormVersion } from "@/features/forms/mutations/saveFormVersion";
import { createFormCheckpoint } from "@/features/forms/mutations/createFormCheckpoint";
import { Alert } from "@/components/ui/Alert";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useFormDraft, FormDraftData } from "@/features/forms/hooks/useFormDraft";

interface SchemaEditClientProps {
  formId: number;
  formName: string;
  formVersion: number;
  initialSchema: Record<string, unknown>;
  initialUiSchema: Record<string, unknown>;
}

interface EditPageContentProps {
  formName: string;
  formVersion: number;
  isSaving: boolean;
  draftToRestore: FormDraftData | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  handleAutoSave: (state: { schema: object; uiSchema: object; formData: object }) => void;
  handleSave: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>;
  handleSaveNewVersion: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>;
  onCancel: () => void;
}

export default function SchemaEditClient({ formId, formName, formVersion, initialSchema, initialUiSchema }: SchemaEditClientProps) {
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
    <FormStudioProvider key={studioKey} initialSchema={currentSchema} initialUiSchema={currentUiSchema}>
      <EditPageContent 
        formName={formName}
        formVersion={formVersion}
        isSaving={isSaving}
        draftToRestore={draftToRestore}
        restoreDraft={restoreDraft}
        discardDraft={discardDraft}
        handleAutoSave={handleAutoSave}
        handleSave={handleSave}
        handleSaveNewVersion={handleSaveNewVersion}
        onCancel={() => router.back()}
      />
    </FormStudioProvider>
  );
}

function EditPageContent(props: EditPageContentProps) {
  const { state } = useFormStudio();

  return (
    <FormPageLayout
      backButton={
        <BackButton onClick={props.onCancel} disabled={props.isSaving}>
          Cancel Editing
        </BackButton>
      }
    >
      <div className="flex-none mb-2">
        <PageHeader
              title={
                <div className="flex items-center gap-3 flex-nowrap">
                  <span className="truncate" title={`Editing: ${props.formName}`}>
                    <span className="text-base-content/50 font-normal">Editing:</span> {props.formName}
                  </span>
                  <Badge variant="primary" outline className="shrink-0 mt-0.5">
                    v{props.formVersion}
                  </Badge>
                </div>
              }
            >
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="primary" outline onClick={() => props.handleSave(state)} disabled={props.isSaving}>
                  Save Changes
                </Button>
                <Button size="sm" variant="primary" onClick={() => props.handleSaveNewVersion(state)} disabled={props.isSaving}>
                  Save as New Version
                </Button>
              </div>
            </PageHeader>
          </div>
          
          {props.draftToRestore && (
            <div className="flex-none mb-6 mt-2">
              <Alert variant="info" showIcon>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                  <div className="text-sm font-medium">
                    We found unsaved changes in your browser from a previous session.
                    {props.draftToRestore.timestamp && (
                      <span className="opacity-75 block sm:inline sm:ml-1 font-normal">
                        (Last edited: {new Date(props.draftToRestore.timestamp).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={props.discardDraft}>
                      Discard
                    </Button>
                    <Button size="sm" variant="primary" onClick={props.restoreDraft}>
                      Restore Draft
                    </Button>
                  </div>
                </div>
              </Alert>
            </div>
          )}

          {/* Borderless FormStudio Container */}
          <div className="flex-1 w-full min-h-0 relative mt-4">
            {props.isSaving && (
              <div className="absolute inset-0 z-50 bg-base-100/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300">
                  <span className="loading loading-spinner text-primary"></span>
                  <span className="font-medium">Saving to database...</span>
                </div>
              </div>
            )}
            <FormStudioUI
              onAutoSave={props.handleAutoSave}
            />
          </div>
    </FormPageLayout>
  );
}
