import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFormVersion, createFormCheckpoint } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

interface SaveState {
  schema: object;
  uiSchema: object;
  formData: object;
}

/**
 * Wraps the form-builder save paths (`saveFormVersion` and
 * `createFormCheckpoint`) for a given draft. On success it clears the local
 * draft, confirms with a toast, and returns to the form detail page; on failure
 * it surfaces the error as a toast (see docs/architecture.md §8.9).
 */
export function useSaveForm(formId: number, options?: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const run = (
    promise: ReturnType<typeof saveFormVersion>,
    successMessage: string
  ) =>
    startSaving(async () => {
      const res = await runAction(promise);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      options?.onSuccess?.();
      toast.success(successMessage);
      router.push(`/collection/${formId}`);
    });

  const save = (state: SaveState) =>
    run(
      saveFormVersion({ formId, schema: state.schema, uiSchema: state.uiSchema }),
      "Changes saved"
    );

  const saveAsNewVersion = (state: SaveState) =>
    run(
      createFormCheckpoint({ formId, schema: state.schema, uiSchema: state.uiSchema }),
      "New version saved"
    );

  return { save, saveAsNewVersion, isSaving };
}
