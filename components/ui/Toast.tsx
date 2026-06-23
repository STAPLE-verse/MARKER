import { Toast as ToastType, resolveValue, toast as hotToast } from "react-hot-toast";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type ToastVariant = "info" | "success" | "error";

const variantFor = (t: ToastType): ToastVariant =>
  t.type === "success" ? "success" : t.type === "error" ? "error" : "info";

const iconMap = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
};

/**
 * Presentational, prop-only toast that renders a DaisyUI `alert`.
 *
 * It mirrors the visual language of `components/ui/Alert` so ephemeral toasts
 * and static banners look consistent. It is the renderer wired into
 * `react-hot-toast`'s `<Toaster>` render-prop (see `Toaster.tsx`), so even
 * plain `toast.success()/error()` calls get this styling. Packageable as
 * `@staple-verse/ui` — it must stay free of feature/router/server imports.
 */
export function Toast({ t }: { t: ToastType }) {
  const variant = variantFor(t);
  const Icon = iconMap[variant];

  return (
    <div
      role="alert"
      className={cn(
        `alert alert-${variant} shadow-lg max-w-sm w-full pointer-events-auto transition-all duration-200`,
        t.visible ? "animate-in fade-in slide-in-from-top-2" : "opacity-0 scale-95"
      )}
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />
      <span className="text-sm flex-1">{resolveValue(t.message, t)}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="btn btn-ghost btn-xs btn-circle"
        onClick={() => hotToast.dismiss(t.id)}
      >
        <XMarkIcon className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
