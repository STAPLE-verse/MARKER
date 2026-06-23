import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { createForm } from "@/features/forms/actions";
import { CreateFormInput } from "@/features/forms/schemas";
import { runAction } from "@/lib/action";
import { applyFieldErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";

/**
 * Wraps the `createForm` server action. On success it opens the builder for the
 * new draft; on failure it maps any server-side field errors back onto the form
 * (inline) and otherwise surfaces a toast (see docs/architecture.md §8.9).
 */
export function useCreateForm(form: UseFormReturn<CreateFormInput>) {
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();

  const create = (data: CreateFormInput) => {
    startCreating(async () => {
      const res = await runAction(createForm(data));
      if (!res.ok) {
        if (!applyFieldErrors(form, res.fieldErrors)) {
          toast.error(res.error);
        }
        return;
      }
      router.push(`/collection/${res.data}/edit`);
    });
  };

  return { create, isCreating };
}
