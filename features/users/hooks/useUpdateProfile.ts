import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { updateProfile } from "@/features/users/actions";
import type { UpdateProfileFormData } from "@/features/users/schemas";
import { runAction } from "@/lib/action";
import { applyFieldErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";

/** Wraps the `updateProfile` server action (see docs/architecture.md §8.9.6). */
export function useUpdateProfile(form: UseFormReturn<UpdateProfileFormData>) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const save = (data: UpdateProfileFormData) => {
    startSaving(async () => {
      const res = await runAction(updateProfile(data));
      if (!res.ok) {
        if (!applyFieldErrors(form, res.fieldErrors)) {
          toast.error(res.error);
        }
        return;
      }
      toast.success("Profile updated");
      router.push("/profile");
    });
  };

  return { save, isSaving };
}
