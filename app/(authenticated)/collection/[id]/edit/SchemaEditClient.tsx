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
} from "@staple-verse/form-studio";
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
import { toIsoTimestamp } from "@/features/forms/utils/timestamps";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaEditClientProps {
  formId: number;
  version: FormVersionDTO;
}

interface DbBaseline {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  updatedAt: string;
}

interface EditPageContentProps {
  formId: number;
  version: FormVersionDTO;
  dbBaseline: DbBaseline;
  isSaving: boolean;
  draftToRestore: FormDraftData | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  clearDraft: () => void;
  handleAutoSave: (state: { schema: object; uiSchema: object; formData: object }) => void;
  handleSave: (state: { schema: object; uiSchema: object; formData: object }) => void;
  handleDone: (state: { schema: object; uiSchema: object; formData: object }, isDirty: boolean) => void;
}

export default function SchemaEditClient({ formId, version }: SchemaEditClientProps) {
  const [dbBaseline, setDbBaseline] = useState<DbBaseline>({
    schema: version.schema,
    uiSchema: version.uiSchema,
    updatedAt: toIsoTimestamp(version.updatedAt),
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
    (state: { schema: object; uiSchema: object }, result: { updatedAt: string }) => {
      setDbBaseline({
        schema: state.schema as Record<string, unknown>,
        uiSchema: state.uiSchema as Record<string, unknown>,
        updatedAt: result.updatedAt,
      });
      clearDraft();
    },
    [clearDraft]
  );

  const { save: handleSave, done: handleDoneInternal, isSaving } = useSaveForm({
    buildSaveInput: (state) => ({
      formId,
      formVersionId: version.id,
      expectedUpdatedAt: dbBaseline.updatedAt,
      schema: state.schema as Record<string, unknown>,
      uiSchema: state.uiSchema as Record<string, unknown>,
    }),
    onSaveSuccess: handleSaveSuccess,
  });

  const handleDone = (
    state: { schema: object; uiSchema: object; formData: object },
    isDirty: boolean
  ) => handleDoneInternal(state, isDirty, formId);

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
        clearDraft={clearDraft}
        handleAutoSave={handleAutoSave}
        handleSave={handleSave}
        handleDone={handleDone}
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

  const handleBack = () => {
    if (isDirty) {
      if (!confirmLeaveWithUnsavedChanges(isDirty)) return;
      props.clearDraft();
    }
    router.push(`/collection/${props.formId}`);
  };

  const saveDisabled = props.isSaving || !isDirty;

  return (
    <FormPageLayout
      backButton={
        <BackButton onClick={handleBack} disabled={props.isSaving}>
          Back to Schema
        </BackButton>
      }
    >
      <div className="flex-none mb-2">
        <PageHeader title={<SchemaHeaderTitle version={props.version} prefix="Form Builder" />}>
          <div className="flex gap-2 items-center">
            <div
              className="tooltip tooltip-bottom inline-block"
              data-tip={
                saveDisabled
                  ? "All changes are saved to your collection"
                  : "Save changes and continue working"
              }
            >
              <span className={saveDisabled ? "inline-block cursor-not-allowed" : "inline-block"}>
                <Button
                  size="sm"
                  variant="secondary"
                  outline
                  onClick={() => props.handleSave(state)}
                  disabled={saveDisabled}
                  className={saveDisabled ? "pointer-events-none" : undefined}
                >
                  Save Changes
                </Button>
              </span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => props.handleDone(state, isDirty)}
              disabled={props.isSaving}
            >
              Done
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
        <FormStudioUI onAutoSave={props.handleAutoSave} saveStatus={saveStatus} />
      </div>
    </FormPageLayout>
  );
}
