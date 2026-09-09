import { useEffect, useState, useTransition } from "react";
import { getStapleVersionPreview } from "@/features/forms/imports/actions/getStapleVersionPreview";
import { runAction } from "@/lib/action";

export interface StapleVersionPreview {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

/**
 * Fetches the read-only preview for one STAPLE form version, refetching
 * whenever `sourceVersionId` changes (see StapleImportModal.tsx).
 */
export function useStapleVersionPreview(sourceFormId: number, sourceVersionId: number | undefined) {
  const [preview, setPreview] = useState<StapleVersionPreview | null>(null);
  const [isLoadingPreview, startLoading] = useTransition();

  useEffect(() => {
    if (!sourceVersionId) {
      // Routed through the same transition-wrapped setState as the fetch
      // path below, rather than called synchronously in the effect body
      // (react-hooks/set-state-in-effect).
      startLoading(async () => setPreview(null));
      return;
    }
    startLoading(async () => {
      const res = await runAction(getStapleVersionPreview({ sourceFormId, sourceVersionId }));
      setPreview(res.ok ? res.data : null);
    });
  }, [sourceFormId, sourceVersionId]);

  return { preview, isLoadingPreview };
}
