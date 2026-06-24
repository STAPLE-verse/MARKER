import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFormVersion } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

interface SaveState {
  schema: object;
  uiSchema: object;
  formData: object;
}

interface UseSaveFormOptions {
  /** Called after a successful in-place save. Does not navigate. */
  onSaveSuccess?: (state: SaveState) => void;
}

/**
 * Wraps `saveFormVersion` for the Form Studio edit page (architecture.md §8.11).
 *
 * - Save Changes persists to the DB and keeps the user in the editor.
 * - Done saves if dirty, then returns to the detail page; if already synced, navigates immediately.
 */
export function useSaveForm(formId: number, options?: UseSaveFormOptions) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const persist = async (state: SaveState): Promise<boolean> => {
    const res = await runAction(
      saveFormVersion({ formId, schema: state.schema, uiSchema: state.uiSchema })
    );
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    options?.onSaveSuccess?.(state);
    toast.success("Changes saved");
    return true;
  };

  const save = (state: SaveState) =>
    startSaving(async () => {
      await persist(state);
    });

  const done = (state: SaveState, isDirty: boolean) => {
    if (!isDirty) {
      router.push(`/collection/${formId}`);
      return;
    }
    startSaving(async () => {
      const ok = await persist(state);
      if (ok) {
        router.push(`/collection/${formId}`);
      }
    });
  };

  return { save, done, isSaving };
}
