import { ActionResult } from "@/utils/action-result";

/**
 * Client-side transport guard for server-action calls.
 *
 * Server actions normalize their *own* expected/unexpected errors into an
 * `ActionResult` (see §8.9.4). But the RPC call itself can still reject before
 * a result is produced (network drop, action failed to execute, serialization
 * error). This wrapper guarantees the call site always receives a result,
 * converting any such transport-level rejection into a generic UNKNOWN result.
 */
export async function runAction<TData, TInput>(
  promise: Promise<ActionResult<TData, TInput>>
): Promise<ActionResult<TData, TInput>> {
  try {
    return await promise;
  } catch (e) {
    console.error("Action transport error:", e);
    return {
      ok: false,
      code: "UNKNOWN",
      error: "Something went wrong. Please try again.",
    };
  }
}
