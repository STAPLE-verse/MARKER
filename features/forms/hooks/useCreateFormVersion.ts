import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFormVersionFromLatest } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Creates a new draft version copied from the latest head and opens the editor
 * (architecture.md §8.11.2 rule 9).
 */
export function useCreateFormVersion(formId: number) {
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();

  const createVersion = () => {
    startCreating(async () => {
      const res = await runAction(createFormVersionFromLatest({ formId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const versionLabel =
        res.data && typeof res.data === "object" && "version" in res.data
          ? `Draft ${res.data.version}`
          : "New draft";
      toast.success(`${versionLabel} created`);
      router.push(`/collection/${formId}/edit`);
    });
  };

  return { createVersion, isCreating };
}
