import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { forkSchema } from "@/features/forms/actions";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";

/**
 * Wraps the `forkSchema` server action. Mirrors `useImportFromStaple.ts`:
 * lands on the new draft's detail page for review, not straight into the
 * editor, same reasoning as import ("Navigate to the form for review, not
 * directly into the editor" — see docs/refactor/staple-import-phase3.md §8).
 */
export function useForkSchema() {
  const router = useRouter();
  const [isForking, startForking] = useTransition();

  const doFork = (publishedSchemaPid: string) => {
    startForking(async () => {
      const res = await runAction(forkSchema({ publishedSchemaPid }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Schema forked to your collection.");
      router.push(`/collection/${res.data}`);
      router.refresh();
    });
  };

  return { doFork, isForking };
}
