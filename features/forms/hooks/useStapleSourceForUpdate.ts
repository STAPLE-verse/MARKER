import { useState, useTransition } from "react";
import { getStapleSourceForUpdate } from "@/features/forms/imports/actions/getStapleSourceForUpdate";
import type { StapleImportFormDTO } from "@/features/forms/imports/queries/getStapleImportOptions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Fetches the scoped STAPLE source on demand (not at page load) when the
 * user clicks "Update from STAPLE" on a form's detail page, then hands the
 * result to StapleImportModal — same lazy-fetch-on-open shape as
 * useStapleVersionPreview.
 */
export function useStapleSourceForUpdate() {
  const [source, setSource] = useState<StapleImportFormDTO | null>(null);
  const [isLoading, startLoading] = useTransition();

  const open = (formId: number) => {
    startLoading(async () => {
      const res = await runAction(getStapleSourceForUpdate({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (!res.data) {
        toast.error("The original STAPLE form is no longer available to import from.");
        return;
      }
      setSource(res.data);
    });
  };

  const close = () => setSource(null);

  return { source, open, close, isLoading };
}
