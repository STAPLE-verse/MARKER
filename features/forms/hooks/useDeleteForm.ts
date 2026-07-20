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
export function useDeleteForm(options?: {
  onSuccess?: () => void;
  /** Navigate here after delete instead of refreshing the current route. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const remove = (formId: number) => {
    startDeleting(async () => {
      const res = await runAction(deleteForm({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Schema deleted");
      if (options?.redirectTo) {
        router.push(options.redirectTo);
      } else {
        router.refresh();
      }
      options?.onSuccess?.();
    });
  };

  return { remove, isDeleting };
}
