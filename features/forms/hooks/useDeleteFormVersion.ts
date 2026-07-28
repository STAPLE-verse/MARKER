import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFormVersion } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Wraps the `deleteFormVersion` server action. Surfaces a success/error toast and
 * refreshes the current route so the deleted version disappears from history.
 */
export function useDeleteFormVersion(
  formId: number,
  options?: {
    onSuccess?: () => void;
    /** Navigate here after delete instead of refreshing the current route. */
    redirectTo?: string;
  }
) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const remove = (versionId: number) => {
    startDeleting(async () => {
      const res = await runAction(deleteFormVersion({ formId, versionId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Draft version deleted");
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
