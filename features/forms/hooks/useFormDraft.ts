import { useState, useEffect, useCallback, useRef } from "react";

export interface FormDraftData {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  baseVersionId: number;
  timestamp?: number;
}

interface DbBaseline {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

function draftStorageKey(formId: number, versionId: number) {
  return `marker-form-draft-${formId}-${versionId}`;
}

function legacyDraftStorageKey(formId: number) {
  return `marker-form-draft-${formId}`;
}

function serializeBaseline(baseline: DbBaseline) {
  return JSON.stringify({ schema: baseline.schema, uiSchema: baseline.uiSchema });
}

function differsFromBaseline(
  schema: object,
  uiSchema: object,
  baseline: DbBaseline
): boolean {
  return (
    serializeBaseline({ schema: schema as Record<string, unknown>, uiSchema: uiSchema as Record<string, unknown> }) !==
    serializeBaseline(baseline)
  );
}

/**
 * Browser recovery buffer for Form Studio editing (architecture.md §8.11).
 * localStorage is never the source of truth — only a crash-recovery cache scoped
 * to the current FormVersion head.
 */
export function useFormDraft(
  formId: number,
  versionId: number,
  dbBaseline: DbBaseline
) {
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<FormDraftData | null>(null);

  const [currentSchema, setCurrentSchema] = useState(dbBaseline.schema);
  const [currentUiSchema, setCurrentUiSchema] = useState(dbBaseline.uiSchema);
  const [studioKey, setStudioKey] = useState(0);

  const dbBaselineRef = useRef(dbBaseline);
  dbBaselineRef.current = dbBaseline;

  const draftKey = draftStorageKey(formId, versionId);

  useEffect(() => {
    // Drop legacy unscoped keys from the previous implementation.
    localStorage.removeItem(legacyDraftStorageKey(formId));

    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<FormDraftData>;
        const isValid =
          parsed?.schema &&
          parsed?.uiSchema &&
          parsed.baseVersionId === versionId &&
          differsFromBaseline(parsed.schema, parsed.uiSchema, dbBaselineRef.current);

        if (isValid) {
          setDraftToRestore(parsed as FormDraftData);
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch {
        localStorage.removeItem(draftKey);
      }
    }
    setDraftLoaded(true);
  }, [draftKey, formId, versionId]);

  const restoreDraft = () => {
    if (draftToRestore) {
      setCurrentSchema(draftToRestore.schema);
      setCurrentUiSchema(draftToRestore.uiSchema);
      setStudioKey((k) => k + 1);
      setDraftToRestore(null);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftToRestore(null);
  };

  const saveDraft = useCallback(
    (schema: object, uiSchema: object) => {
      const baseline = dbBaselineRef.current;
      if (!differsFromBaseline(schema, uiSchema, baseline)) {
        localStorage.removeItem(draftKey);
        return;
      }

      const payload: FormDraftData = {
        schema: schema as Record<string, unknown>,
        uiSchema: uiSchema as Record<string, unknown>,
        baseVersionId: versionId,
        timestamp: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    },
    [draftKey, versionId]
  );

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  return {
    draftLoaded,
    draftToRestore,
    currentSchema,
    currentUiSchema,
    studioKey,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft,
  };
}

export function isDirtyVsDbBaseline(
  schema: object,
  uiSchema: object,
  baseline: DbBaseline
): boolean {
  return differsFromBaseline(schema, uiSchema, baseline);
}
