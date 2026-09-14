import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { changePassword } from "@/features/users/actions";
import type { ChangePasswordFormData } from "@/features/users/schemas";
import { runAction } from "@/lib/action";
import { applyFieldErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";

/**
 * Wraps the `changePassword` server action. A wrong current password is a
 * blocking error the user must read (mirrors the failed-login pattern in
 * LoginForm), so it is surfaced as `formError` for an inline alert rather
 * than a toast — see docs/architecture.md §8.9.2.
 */
export function useChangePassword(form: UseFormReturn<ChangePasswordFormData>) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const save = (data: ChangePasswordFormData) => {
    setFormError(null);
    startSaving(async () => {
      const res = await runAction(changePassword(data));
      if (!res.ok) {
        if (!applyFieldErrors(form, res.fieldErrors)) {
          setFormError(res.error);
        }
        return;
      }
      toast.success("Password updated");
      router.push("/profile");
    });
  };

  return { save, isSaving, formError };
}
