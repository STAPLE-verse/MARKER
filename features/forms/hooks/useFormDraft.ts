import { useState, useEffect } from "react";

export interface FormDraftData {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  timestamp?: number;
}

export function useFormDraft(formId: number, initialSchema: Record<string, unknown>, initialUiSchema: Record<string, unknown>) {
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<FormDraftData | null>(null);
  
  const [currentSchema, setCurrentSchema] = useState(initialSchema);
  const [currentUiSchema, setCurrentUiSchema] = useState(initialUiSchema);
  const [studioKey, setStudioKey] = useState(0);

  const draftKey = `marker-form-draft-${formId}`;

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.schema && parsed.uiSchema) {
          setDraftToRestore(parsed);
        }
      } catch (e) {
        localStorage.removeItem(draftKey);
      }
    }
    setDraftLoaded(true);
  }, [draftKey]);

  const restoreDraft = () => {
    if (draftToRestore) {
      setCurrentSchema(draftToRestore.schema as Record<string, unknown>);
      setCurrentUiSchema(draftToRestore.uiSchema as Record<string, unknown>);
      setStudioKey(k => k + 1); // Force FormStudio to remount with new initial props
      setDraftToRestore(null);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftToRestore(null);
  };

  const saveDraft = (schema: object, uiSchema: object) => {
    localStorage.setItem(draftKey, JSON.stringify({
      schema,
      uiSchema,
      timestamp: Date.now()
    }));
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
  };

  return {
    draftLoaded,
    draftToRestore,
    currentSchema,
    currentUiSchema,
    studioKey,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft
  };
}
