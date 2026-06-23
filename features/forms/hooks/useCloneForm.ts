import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cloneFormVersion } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Wraps the `cloneFormVersion` server action for button-triggered cloning.
 *
 * Uses `useTransition` (the modern idiom for imperative action calls) so callers
 * get a `isCloning` pending flag without manual `useState`, and navigation stays
 * responsive. This hook is the seam where the standardized error/toast strategy
 * is applied (see docs/architecture.md §8.9).
 */
export function useCloneForm() {
  const router = useRouter();
  const [isCloning, startCloning] = useTransition();

  const clone = (versionId: number) => {
    startCloning(async () => {
      const res = await runAction(cloneFormVersion({ versionId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Form cloned");
      router.push(`/collection/${res.data}`);
    });
  };

  return { clone, isCloning };
}
