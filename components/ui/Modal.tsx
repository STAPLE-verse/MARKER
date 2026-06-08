"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Modal — shared dialog/overlay component.
 *
 * Uses the native HTML <dialog> element for accessibility (focus trapping,
 * Escape key, aria roles) instead of STAPLE's `react-overlays` dependency.
 * This keeps the shared package dependency-free.
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

export function Modal({ open, onClose, title, size = 'md', children, className }: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
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
    </dialog>
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
