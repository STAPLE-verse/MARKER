import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cloneFormVersion } from "@/features/forms/actions";

/**
 * Wraps the `cloneFormVersion` server action for button-triggered cloning.
 *
 * Uses `useTransition` (the modern idiom for imperative action calls) so callers
 * get a `isCloning` pending flag without manual `useState`, and navigation stays
 * responsive. This hook is also the single seam where the standardized
 * error/toast strategy will be wired in later.
 */
export function useCloneForm() {
  const router = useRouter();
  const [isCloning, startCloning] = useTransition();

  const clone = (versionId: number) => {
    startCloning(async () => {
      try {
        const newFormId = await cloneFormVersion({ versionId });
        router.push(`/collection/${newFormId}`);
      } catch (error) {
        console.error("Failed to clone form", error);
      }
    });
  };

  return { clone, isCloning };
}
