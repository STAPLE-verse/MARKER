import { toast } from "react-hot-toast";

/**
 * Single import surface for triggering toasts. Call sites import from
 * `@/lib/toast` rather than `react-hot-toast` directly, so the underlying
 * engine can be swapped from one place (see docs/architecture.md §8.9.5).
 */
export { toast };

export function useToast() {
  return {
    success: toast.success,
    error: toast.error,
    promise: toast.promise,
  };
}
