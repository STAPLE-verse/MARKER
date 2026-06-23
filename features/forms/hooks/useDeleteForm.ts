import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteForm } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Wraps the `deleteForm` server action. Surfaces a success/error toast and
 * refreshes the current route so the deleted row disappears
 * (see docs/architecture.md §8.9).
 */
export function useDeleteForm(options?: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const remove = (formId: number) => {
    startDeleting(async () => {
      const res = await runAction(deleteForm({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      options?.onSuccess?.();
      toast.success("Schema deleted");
      router.refresh();
    });
  };

  return { remove, isDeleting };
}
