import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreFormVersionAsDraft } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Copies a selected historical version into a new draft head and opens it for editing.
 */
export function useRestoreFormVersion(formId: number) {
  const router = useRouter();
  const [isRestoring, startRestoring] = useTransition();

  const restoreVersion = (versionId: number) => {
    startRestoring(async () => {
      const res = await runAction(restoreFormVersionAsDraft({ formId, versionId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const versionLabel =
        res.data && typeof res.data === "object" && "version" in res.data
          ? `Draft ${res.data.version}`
          : "New draft";
      toast.success(`${versionLabel} restored`);
      router.push(`/collection/${formId}/edit`);
    });
  };

  return { restoreVersion, isRestoring };
}
