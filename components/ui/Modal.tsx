"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Modal — shared dialog/overlay component.
 *
 * Uses the native HTML <dialog> element for accessibility (focus trapping,
 * Escape key, aria roles) instead of STAPLE's `react-overlays` dependency.
 * This keeps the shared package dependency-free.
 *
 * Rendered via a portal into `document.body` rather than in place: its
 * backdrop-close mechanism is a real `<form method="dialog">`, and a modal
 * is very often opened from inside a page's own `<form>` — without the
 * portal that nests a form inside a form, which is invalid HTML and breaks
 * hydration.
 *
 * Controlled via `open` + `onClose` props — no internal state.
 *
 * @example
 * // Basic usage
 * const [open, setOpen] = useState(false);
 * <Modal open={open} onClose={() => setOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 *   <ModalActions>
 *     <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
 *     <button className="btn btn-primary" onClick={handleConfirm}>Confirm</button>
 *   </ModalActions>
 * </Modal>
 */

// --- Modal ---

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
} as const;

// `document.body` doesn't exist during SSR, so the portal target is only
// available after mount. useSyncExternalStore (rather than setState inside
// an effect) is React's own hydration-safe way to flip a value like this:
// it renders `false` for the server/first-hydration pass to match SSR
// output, then schedules the follow-up client render itself.
function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Modal({ open, onClose, title, size = 'md', children, className }: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const mounted = useIsMounted();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cn(
        // DaisyUI modal styling
        "modal modal-bottom sm:modal-middle",
        open && "modal-open"
      )}
      onClose={onClose}
      // Close on backdrop click
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className={cn("modal-box", sizeClasses[size], className)}>
        {title && (
          <h3 className="text-lg font-bold">{title}</h3>
        )}
        {children}
      </div>
      {/* Transparent backdrop form — enables closing via ESC and click-outside */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit" tabIndex={-1}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

// --- ModalActions ---

const ModalActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("modal-action", className)} {...props} />
  )
);
ModalActions.displayName = 'ModalActions';

export { ModalActions };
