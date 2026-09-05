import { useState, useEffect, useCallback, useRef } from "react";
import { computeStateFingerprint } from "@staple-verse/form-studio";
import { semanticV1Extension } from "@staple-verse/form-studio/semantic-v1";

export interface FormDraftData {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  semantics: Record<string, unknown> | null;
  baseVersionId: number;
  timestamp?: number;
}

export interface DbBaseline {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  semantics: Record<string, unknown> | null;
}

function draftStorageKey(formId: number, versionId: number) {
  return `marker-form-draft-${formId}-${versionId}`;
}

function legacyDraftStorageKey(formId: number) {
  return `marker-form-draft-${formId}`;
}

function toExtensionValues(semantics: Record<string, unknown> | null): Record<string, unknown> {
  return semantics === null ? {} : { [semanticV1Extension.id]: semantics };
}

/**
 * Single source of truth for "did the authored state change." Reuses
 * form-studio's own fingerprint (schema + uiSchema + extensionValues) instead
 * of hand-rolling a second, narrower one — a semantics-only edit (schema and
 * uiSchema unchanged) must still count as a change, and this is exactly what
 * form-studio's own autosave/dirty logic already relies on internally.
 */
function differsFromBaseline(
  schema: object,
  uiSchema: object,
  semantics: Record<string, unknown> | null,
  baseline: DbBaseline
): boolean {
  return (
    computeStateFingerprint({
      schema: schema as Record<string, unknown>,
      uiSchema: uiSchema as Record<string, unknown>,
      extensionValues: toExtensionValues(semantics),
    }) !==
    computeStateFingerprint({
      schema: baseline.schema,
      uiSchema: baseline.uiSchema,
      extensionValues: toExtensionValues(baseline.semantics),
    })
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
  const [currentSemantics, setCurrentSemantics] = useState(dbBaseline.semantics);
  const [studioKey, setStudioKey] = useState(0);

  const dbBaselineRef = useRef(dbBaseline);
  useEffect(() => {
    dbBaselineRef.current = dbBaseline;
  }, [dbBaseline]);

  const draftKey = draftStorageKey(formId, versionId);

  useEffect(() => {
    // Drop legacy unscoped keys from the previous implementation.
    localStorage.removeItem(legacyDraftStorageKey(formId));

    let nextDraftToRestore: FormDraftData | null = null;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<FormDraftData>;
        const isValid =
          parsed?.schema &&
          parsed?.uiSchema &&
          parsed.baseVersionId === versionId &&
          differsFromBaseline(
            parsed.schema,
            parsed.uiSchema,
            parsed.semantics ?? null,
            dbBaselineRef.current
          );

        if (isValid) {
          nextDraftToRestore = parsed as FormDraftData;
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    // A single unconditional update at the end of the effect, mirroring how
    // draftLoaded was already written — the earlier version of this hook
    // called setDraftToRestore conditionally from inside the try/if above,
    // which read as ad hoc derived state to the react-hooks lint rule even
    // though the effect itself (a one-time localStorage read) is genuinely
    // unavoidable: localStorage doesn't exist during SSR, so this can't be
    // computed during render without risking a hydration mismatch.
    setDraftToRestore(nextDraftToRestore);
    setDraftLoaded(true);
  }, [draftKey, formId, versionId]);

  const restoreDraft = () => {
    if (draftToRestore) {
      setCurrentSchema(draftToRestore.schema);
      setCurrentUiSchema(draftToRestore.uiSchema);
      setCurrentSemantics(draftToRestore.semantics);
      setStudioKey((k) => k + 1);
      setDraftToRestore(null);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftToRestore(null);
  };

  const saveDraft = useCallback(
    (schema: object, uiSchema: object, semantics: Record<string, unknown> | null) => {
      const baseline = dbBaselineRef.current;
      if (!differsFromBaseline(schema, uiSchema, semantics, baseline)) {
        localStorage.removeItem(draftKey);
        return;
      }

      const payload: FormDraftData = {
        schema: schema as Record<string, unknown>,
        uiSchema: uiSchema as Record<string, unknown>,
        semantics,
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
    currentSemantics,
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
  semantics: Record<string, unknown> | null,
  baseline: DbBaseline
): boolean {
  return differsFromBaseline(schema, uiSchema, semantics, baseline);
}
