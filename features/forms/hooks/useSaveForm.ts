import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormStudioState } from "@staple-verse/form-studio";
import { saveFormVersion } from "@/features/forms/actions";
import { SaveFormVersionInput } from "@/features/forms/schemas";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

interface SaveSuccessResult {
  updatedAt: string;
}

interface UseSaveFormOptions {
  buildSaveInput: (state: FormStudioState) => SaveFormVersionInput;
  /** Called after a successful in-place save. Does not navigate. */
  onSaveSuccess?: (state: FormStudioState, result: SaveSuccessResult) => void;
}

/**
 * Wraps `saveFormVersion` for the Form Studio edit page (architecture.md §8.11).
 */
export function useSaveForm(options: UseSaveFormOptions) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const persist = async (state: FormStudioState): Promise<boolean> => {
    const res = await runAction(saveFormVersion(options.buildSaveInput(state)));
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    if (res.data && typeof res.data === "object" && "updatedAt" in res.data) {
      options.onSaveSuccess?.(state, { updatedAt: res.data.updatedAt as string });
    }
    toast.success("Changes saved");
    return true;
  };

  const save = (state: FormStudioState) =>
    startSaving(async () => {
      await persist(state);
    });

  const done = (state: FormStudioState, isDirty: boolean, formId: number) => {
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
