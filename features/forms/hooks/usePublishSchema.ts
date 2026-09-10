import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { publishSchema } from "@/features/forms/actions";
import { PublishFormInput, PublishReviewInput } from "@/features/forms/schemas";
import { runAction } from "@/lib/action";
import { applyFieldErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";
import { toIsoTimestamp } from "@/features/forms/utils/timestamps";

/**
 * Wraps the `publishSchema` server action for the publish wizard's final
 * "Publish & Freeze Version" step. Only takes `PublishReviewInput` (Step 3's
 * own fields) — Steps 1-2's FAIR metadata/contributors are persisted
 * separately, through `useSavePublicationMetadata`, and `publishSchema`
 * reads that row itself rather than taking it as input. `form` stays typed
 * to the wizard's full `PublishFormInput` so server-side field errors (e.g.
 * on `version`) still land on the right input.
 */
export function usePublishSchema(
  formId: number,
  formVersionId: number,
  expectedUpdatedAt: Date | string,
  form: UseFormReturn<PublishFormInput>
) {
  const router = useRouter();
  const [isPublishing, startPublishing] = useTransition();

  const publish = (data: PublishReviewInput) => {
    startPublishing(async () => {
      const res = await runAction(
        publishSchema({
          ...data,
          formId,
          formVersionId,
          expectedUpdatedAt: toIsoTimestamp(expectedUpdatedAt),
        })
      );
      if (!res.ok) {
        if (!applyFieldErrors(form, res.fieldErrors)) {
          toast.error(res.error);
        }
        return;
      }
      toast.success("Schema published");
      router.push(`/collection/${formId}?published=${res.data.pid}`);
    });
  };

  return { publish, isPublishing };
}
