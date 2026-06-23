import { z } from "zod";
import { requireAuth } from "./auth";
import {
  ActionResult,
  FieldErrors,
  normalizeActionError,
} from "./action-result";

type AuthenticatedActionHandler<TInput, TOutput> = (args: {
  input: TInput;
  userId: number;
}) => Promise<TOutput>;

/**
 * Wraps a server action with authentication, Zod validation, and the
 * standardized `ActionResult` envelope (see docs/architecture.md §8.9).
 *
 * The wrapper never throws across the action boundary:
 * - auth failure       → `{ ok: false, code: "UNAUTHORIZED" }`
 * - invalid input      → `{ ok: false, code: "VALIDATION", fieldErrors }`
 * - thrown ActionError → its code + message
 * - anything else      → logged server-side and collapsed to `UNKNOWN`
 */
export function authenticatedAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: AuthenticatedActionHandler<TInput, TOutput>
) {
  return async (input: unknown): Promise<ActionResult<TOutput, TInput>> => {
    try {
      // 1. Authenticate user first (throws ActionError "UNAUTHORIZED").
      const { userId } = await requireAuth();

      // 2. Validate input schema. safeParse keeps validation in the envelope
      //    rather than throwing, so callers can map fieldErrors back inline.
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        return {
          ok: false,
          code: "VALIDATION",
          error: "Please fix the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors<TInput>,
        };
      }

      // 3. Execute business logic.
      const data = await handler({ input: parsed.data, userId });
      return { ok: true, data };
    } catch (e) {
      return normalizeActionError<TInput>(e);
    }
  };
}
