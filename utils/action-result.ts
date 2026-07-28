import { z } from "zod";

/**
 * The standardized error-handling contract for MARKER server actions (Option B).
 * See docs/architecture.md §8.9 for the full rationale.
 *
 * Actions never throw for *expected* errors — they return an `ActionResult`
 * discriminated union so a single call can carry both field-level errors
 * (for inline display) and a top-level message (for a toast/alert).
 */

export type ActionErrorCode =
  | "VALIDATION" // input failed Zod; carries fieldErrors
  | "UNAUTHORIZED" // not signed in
  | "FORBIDDEN" // signed in but not allowed
  | "NOT_FOUND"
  | "CONFLICT" // e.g. version already exists, optimistic-lock clash
  | "UNKNOWN"; // unexpected; generic message, logged server-side

export type FieldErrors<TInput> = Partial<Record<keyof TInput, string[]>>;

export type ActionResult<TData, TInput = unknown> =
  | { ok: true; data: TData }
  | {
      ok: false;
      code: ActionErrorCode;
      /** User-safe, human-readable summary. */
      error: string;
      fieldErrors?: FieldErrors<TInput>;
    };

/**
 * Thrown *inside* action handlers and authorization helpers to signal an
 * expected error with a specific code. Anything that is NOT an `ActionError`
 * is treated as unexpected and collapsed to `UNKNOWN` by `normalizeActionError`.
 */
export class ActionError extends Error {
  constructor(
    public code: ActionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ActionError";
  }
}

const UNKNOWN_MESSAGE = "Something went wrong. Please try again.";

/**
 * Converts a thrown value into a failed `ActionResult`.
 *
 * - `ActionError` → its code + message (already user-safe).
 * - `ZodError` → a VALIDATION result with flattened field errors.
 * - anything else → logged server-side and collapsed to a generic UNKNOWN
 *   result so internal detail never leaks to the client.
 */
export function normalizeActionError<TInput = unknown>(
  e: unknown
): Extract<ActionResult<never, TInput>, { ok: false }> {
  if (e instanceof ActionError) {
    return { ok: false, code: e.code, error: e.message };
  }

  if (e instanceof z.ZodError) {
    return {
      ok: false,
      code: "VALIDATION",
      error: "Please fix the highlighted fields.",
      fieldErrors: e.flatten().fieldErrors as FieldErrors<TInput>,
    };
  }

  console.error("Unexpected action error:", e);
  return { ok: false, code: "UNKNOWN", error: UNKNOWN_MESSAGE };
}
