"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  FormStudioProvider,
  FormStudioUI,
  useFormStudio,
  type FormStudioSaveStatus,
} from "@/features/form-builder";
import { Alert } from "@/components/ui/Alert";
import { BackButton } from "@/components/ui/BackButton";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import {
  useFormDraft,
  FormDraftData,
  isDirtyVsDbBaseline,
} from "@/features/forms/hooks/useFormDraft";
import { useSaveForm } from "@/features/forms/hooks/useSaveForm";
import {
  useUnsavedChangesGuard,
  confirmLeaveWithUnsavedChanges,
} from "@/features/forms/hooks/useUnsavedChangesGuard";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaEditClientProps {
  formId: number;
  version: FormVersionDTO;
}

interface EditPageContentProps {
  formId: number;
  version: FormVersionDTO;
  dbBaseline: { schema: Record<string, unknown>; uiSchema: Record<string, unknown> };
  isSaving: boolean;
  draftToRestore: FormDraftData | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  handleAutoSave: (state: { schema: object; uiSchema: object; formData: object }) => void;
  handleSave: (state: { schema: object; uiSchema: object; formData: object }) => void;
  handleSaveNewVersion: (state: { schema: object; uiSchema: object; formData: object }) => void;
}

export default function SchemaEditClient({ formId, version }: SchemaEditClientProps) {
  const [dbBaseline, setDbBaseline] = useState({
    schema: version.schema,
    uiSchema: version.uiSchema,
  });

  const {
    draftLoaded,
    draftToRestore,
    currentSchema,
    currentUiSchema,
    studioKey,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft,
  } = useFormDraft(formId, version.id, dbBaseline);

  const handleSaveSuccess = useCallback(
    (state: { schema: object; uiSchema: object }) => {
      setDbBaseline({
        schema: state.schema as Record<string, unknown>,
        uiSchema: state.uiSchema as Record<string, unknown>,
      });
      clearDraft();
    },
    [clearDraft]
  );

  const { save: handleSave, saveAsNewVersion: handleSaveNewVersion, isSaving } = useSaveForm(
    formId,
    {
      onSaveSuccess: handleSaveSuccess,
      onCheckpointSuccess: clearDraft,
    }
  );

  const handleAutoSave = (state: { schema: object; uiSchema: object; formData: object }) => {
    saveDraft(state.schema, state.uiSchema);
  };

  if (!draftLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  return (
    <FormStudioProvider
      key={studioKey}
      initialSchema={currentSchema}
      initialUiSchema={currentUiSchema}
    >
      <EditPageContent
        formId={formId}
        version={version}
        dbBaseline={dbBaseline}
        isSaving={isSaving}
        draftToRestore={draftToRestore}
        restoreDraft={restoreDraft}
        discardDraft={discardDraft}
        handleAutoSave={handleAutoSave}
        handleSave={handleSave}
        handleSaveNewVersion={handleSaveNewVersion}
      />
    </FormStudioProvider>
  );
}

function EditPageContent(props: EditPageContentProps) {
  const router = useRouter();
  const { state } = useFormStudio();

  const isDirty = useMemo(
    () => isDirtyVsDbBaseline(state.schema, state.uiSchema, props.dbBaseline),
    [state.schema, state.uiSchema, props.dbBaseline]
  );

  const saveStatus: FormStudioSaveStatus = props.isSaving
    ? "saving"
    : isDirty
      ? "unsaved"
      : "synced";

  useUnsavedChangesGuard(isDirty);

  const handleCancel = () => {
    if (!confirmLeaveWithUnsavedChanges(isDirty)) return;
    router.push(`/collection/${props.formId}`);
  };

  return (
    <FormPageLayout
      backButton={
        <BackButton onClick={handleCancel} disabled={props.isSaving}>
          Cancel Editing
        </BackButton>
      }
    >
      <div className="flex-none mb-2">
        <PageHeader title={<SchemaHeaderTitle version={props.version} prefix="Form Builder" />}>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant="primary"
              outline
              onClick={() => props.handleSave(state)}
              disabled={props.isSaving || !isDirty}
            >
              Save Changes
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => props.handleSaveNewVersion(state)}
              disabled={props.isSaving}
            >
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

      <div className="flex-1 w-full min-h-0 relative mt-4">
        {props.isSaving && (
          <div className="absolute inset-0 z-50 bg-base-100/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300">
              <span className="loading loading-spinner text-primary"></span>
              <span className="font-medium">Saving…</span>
            </div>
          </div>
        )}
        <FormStudioUI onAutoSave={props.handleAutoSave} saveStatus={saveStatus} />
      </div>
    </FormPageLayout>
  );
}
