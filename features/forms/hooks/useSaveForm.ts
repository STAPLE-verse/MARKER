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

interface UseSaveFormOptions {
  /** Called after a successful in-place save (Save Changes). Does not navigate. */
  onSaveSuccess?: (state: SaveState) => void;
  /** Called after a successful checkpoint before navigating to the detail page. */
  onCheckpointSuccess?: () => void;
}

/**
 * Wraps the form-builder save paths (`saveFormVersion` and
 * `createFormCheckpoint`) for a given draft (architecture.md §8.11).
 *
 * - Save Changes persists to the DB and keeps the user in the editor.
 * - Save as New Version creates a checkpoint and returns to the detail page.
 */
export function useSaveForm(formId: number, options?: UseSaveFormOptions) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const save = (state: SaveState) =>
    startSaving(async () => {
      const res = await runAction(
        saveFormVersion({ formId, schema: state.schema, uiSchema: state.uiSchema })
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      options?.onSaveSuccess?.(state);
      toast.success("Changes saved");
    });

  const saveAsNewVersion = (state: SaveState) =>
    startSaving(async () => {
      const res = await runAction(
        createFormCheckpoint({ formId, schema: state.schema, uiSchema: state.uiSchema })
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      options?.onCheckpointSuccess?.();
      const versionLabel =
        res.data && typeof res.data === "object" && "version" in res.data
          ? `Draft ${res.data.version}`
          : "New version";
      toast.success(`${versionLabel} saved`);
      router.push(`/collection/${formId}`);
    });

  return { save, saveAsNewVersion, isSaving };
}
