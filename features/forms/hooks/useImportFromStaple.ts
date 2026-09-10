import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { importFromStaple } from "@/features/forms/imports/actions/importFromStaple";
import { ImportFromStapleInput } from "@/features/forms/schemas";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Wraps the `importFromStaple` server action. The modal uses plain local
 * state (version/destination pickers) rather than react-hook-form, so this
 * takes an explicit error callback instead of a form instance to apply
 * field errors onto (see StapleImportModal.tsx).
 */
export function useImportFromStaple() {
  const router = useRouter();
  const [isImporting, startImporting] = useTransition();

  const doImport = (input: ImportFromStapleInput, onError: (message: string) => void) => {
    startImporting(async () => {
      const res = await runAction(importFromStaple(input));
      if (!res.ok) {
        onError(res.error);
        return;
      }
      toast.success(
        res.data.mode === "create" ? "Schema imported from STAPLE." : "Import applied as a new version."
      );
      // Navigate to the form for review, not directly into the editor
      // (unlike native creation) — see docs/refactor/staple-import-phase3.md §8.
      // Update mode can be triggered from that same detail page (see
      // UpdateFromStapleButton) — push() alone is a no-op navigation there,
      // so refresh() explicitly re-fetches the now-stale server data.
      router.push(`/collection/${res.data.formId}`);
      router.refresh();
    });
  };

  return { doImport, isImporting };
}
