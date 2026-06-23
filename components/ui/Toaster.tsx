"use client";

import { Toaster as HotToaster } from "react-hot-toast";
import { Toast } from "./Toast";

/**
 * Mounts the `react-hot-toast` engine and renders every toast through our
 * DaisyUI `Toast` component via the render-prop, so styling is consistent
 * regardless of which `toast.*` helper triggered it.
 *
 * Mounted once in the root layout (`app/layout.tsx`) so every route — including
 * auth/public pages — can surface toasts. See docs/architecture.md §8.9.5.
 */
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      toastOptions={{ duration: 4000 }}
    >
      {(t) => <Toast t={t} />}
    </HotToaster>
  );
}
