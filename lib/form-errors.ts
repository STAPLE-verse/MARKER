import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FieldErrors } from "@/utils/action-result";

/**
 * Maps server-side `fieldErrors` from a failed `ActionResult` back onto a
 * react-hook-form instance so validation that ran on the server surfaces
 * inline, next to the relevant inputs (see docs/architecture.md §8.9.6).
 *
 * Returns true if at least one field error was applied, so callers can decide
 * whether to also show a top-level toast.
 */
export function applyFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: FieldErrors<T> | undefined
): boolean {
  if (!fieldErrors) return false;

  let applied = false;
  for (const [name, messages] of Object.entries(fieldErrors)) {
    const message = (messages as string[] | undefined)?.[0];
    if (message) {
      form.setError(name as Path<T>, { type: "server", message });
      applied = true;
    }
  }
  return applied;
}
