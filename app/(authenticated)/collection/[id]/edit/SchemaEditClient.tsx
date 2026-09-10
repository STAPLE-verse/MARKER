"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  FormStudioProvider,
  FormStudioUI,
  useFormStudio,
  useFormStudioCommit,
  type FormStudioSaveStatus,
  type FormStudioState,
} from "@staple-verse/form-studio";
import { semanticV1Extension } from "@staple-verse/form-studio/semantic-v1";
import { Alert } from "@/components/ui/Alert";
import { BackButton } from "@/components/ui/BackButton";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import {
  useFormDraft,
  FormDraftData,
  isDirtyVsDbBaseline,
  type DbBaseline,
} from "@/features/forms/hooks/useFormDraft";
import { useSaveForm } from "@/features/forms/hooks/useSaveForm";
import {
  useUnsavedChangesGuard,
  confirmLeaveWithUnsavedChanges,
} from "@/features/forms/hooks/useUnsavedChangesGuard";
import { toIsoTimestamp } from "@/features/forms/utils/timestamps";
import { FormVersionDTO } from "@/features/forms/types";

const FORM_STUDIO_EXTENSIONS = [semanticV1Extension] as const;

interface SchemaEditClientProps {
  formId: number;
  version: FormVersionDTO;
}

type EditDbBaseline = DbBaseline & { updatedAt: string };

function extensionValueOf(state: FormStudioState): Record<string, unknown> | null {
  return (state.extensionValues[semanticV1Extension.id] ?? null) as Record<string, unknown> | null;
}

interface EditPageContentProps {
  formId: number;
  version: FormVersionDTO;
  dbBaseline: EditDbBaseline;
  isSaving: boolean;
  draftToRestore: FormDraftData | null;
  restoreDraft: () => void;
  discardDraft: () => void;
  clearDraft: () => void;
  handleAutoSave: (state: FormStudioState) => void;
  handleSave: (state: FormStudioState) => void;
  handleDone: (state: FormStudioState, isDirty: boolean) => void;
}

export default function SchemaEditClient({ formId, version }: SchemaEditClientProps) {
  const [dbBaseline, setDbBaseline] = useState<EditDbBaseline>({
    schema: version.schema,
    uiSchema: version.uiSchema,
    semantics: version.semantics,
    updatedAt: toIsoTimestamp(version.updatedAt),
  });

  const {
    draftLoaded,
    draftToRestore,
    currentSchema,
    currentUiSchema,
    currentSemantics,
    studioKey,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft,
  } = useFormDraft(formId, version.id, dbBaseline);

  const handleSaveSuccess = useCallback(
    (state: FormStudioState, result: { updatedAt: string }) => {
      setDbBaseline({
        schema: state.schema as Record<string, unknown>,
        uiSchema: state.uiSchema as Record<string, unknown>,
        semantics: extensionValueOf(state),
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
      semantics: extensionValueOf(state),
    }),
    onSaveSuccess: handleSaveSuccess,
  });

  const handleDone = (state: FormStudioState, isDirty: boolean) =>
    handleDoneInternal(state, isDirty, formId);

  const handleAutoSave = (state: FormStudioState) => {
    saveDraft(state.schema, state.uiSchema, extensionValueOf(state));
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
      extensions={FORM_STUDIO_EXTENSIONS}
      initialSchema={currentSchema}
      initialUiSchema={currentUiSchema}
      initialExtensionValues={
        currentSemantics === null ? {} : { [semanticV1Extension.id]: currentSemantics }
      }
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
  const { blockingDiagnostics, commitDiagnostics, attemptCommit } = useFormStudioCommit();

  const isDirty = useMemo(
    () => isDirtyVsDbBaseline(state.schema, state.uiSchema, extensionValueOf(state), props.dbBaseline),
    [state, props.dbBaseline]
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

  const saveDisabled = props.isSaving || !isDirty || blockingDiagnostics.length > 0;
  const saveTooltip =
    blockingDiagnostics.length > 0
      ? "Resolve the validation issues below before saving."
      : saveDisabled
        ? "All changes are saved to your collection"
        : "Save changes and continue working";

  const handleSaveClick = () => attemptCommit(props.handleSave);

  // "Done" only needs the commit gate when it's actually about to save
  // (isDirty) — with nothing to save, it should still let the user leave the
  // same way "Back" already does, even if some stray diagnostic exists.
  const handleDoneClick = () => {
    if (!isDirty) {
      props.handleDone(state, isDirty);
      return;
    }
    attemptCommit((snapshot) => props.handleDone(snapshot, isDirty));
  };

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
            <div className="tooltip tooltip-bottom inline-block" data-tip={saveTooltip}>
              <span className={saveDisabled ? "inline-block cursor-not-allowed" : "inline-block"}>
                <Button
                  size="sm"
                  variant="secondary"
                  outline
                  onClick={handleSaveClick}
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
              onClick={handleDoneClick}
              disabled={props.isSaving}
            >
              Done
            </Button>
          </div>
        </PageHeader>
      </div>

      {commitDiagnostics.length > 0 && (
        <div className="flex-none mb-6 mt-2">
          <Alert variant="warning" showIcon>
            <div className="text-sm font-medium">
              Validation issues must be resolved before saving.
              <ul className="mt-1 list-disc pl-5 font-normal">
                {commitDiagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.source}-${diagnostic.code}-${index}`}>
                    {diagnostic.message}
                  </li>
                ))}
              </ul>
            </div>
          </Alert>
        </div>
      )}

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
