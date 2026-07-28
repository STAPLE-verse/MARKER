import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { unarchiveForm } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

export function useUnarchiveForm(options?: {
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isRecovering, startRecovering] = useTransition();

  const recover = (formId: number) => {
    startRecovering(async () => {
      const res = await runAction(unarchiveForm({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Schema recovered");
      if (options?.redirectTo) {
        router.push(options.redirectTo);
      } else {
        router.refresh();
      }
      options?.onSuccess?.();
    });
  };

  return { recover, isRecovering };
}
