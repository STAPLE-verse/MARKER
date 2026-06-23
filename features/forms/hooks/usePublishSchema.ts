import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { publishSchema } from "@/features/forms/actions";
import { PublishFormInput } from "@/features/forms/schemas";
import { runAction } from "@/lib/action";
import { applyFieldErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";

/**
 * Wraps the `publishSchema` server action for the publish wizard. On success it
 * confirms with a toast and returns to the (now published) form detail page; on
 * failure it maps server-side field errors back onto the wizard form (inline)
 * and otherwise surfaces a toast (see docs/architecture.md §8.9).
 */
export function usePublishSchema(formId: number, form: UseFormReturn<PublishFormInput>) {
  const router = useRouter();
  const [isPublishing, startPublishing] = useTransition();

  const publish = (data: PublishFormInput) => {
    startPublishing(async () => {
      const res = await runAction(publishSchema({ ...data, formId }));
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
