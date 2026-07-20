import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { permanentlyDeleteForm } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

export function usePermanentlyDeleteForm(options?: {
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const remove = (formId: number) => {
    startDeleting(async () => {
      const res = await runAction(permanentlyDeleteForm({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Schema permanently deleted");
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
