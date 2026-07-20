"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "link";
type ButtonSize = "lg" | "md" | "sm" | "xs";

export interface ConfirmActionButtonProps {
  triggerLabel: React.ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  disabled?: boolean;
  disabledReason?: string;
  triggerAriaLabel?: string;
  modalTitle: string;
  modalBody: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant?: ButtonVariant;
  confirmClassName?: string;
  isPending: boolean;
  onConfirm: () => void;
  /** When provided, modal open state is controlled by the parent (e.g. to close on mutation success). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Trigger button + confirmation modal + cancel/confirm actions.
 * Parent supplies `isPending` and `onConfirm`; optionally controls `open`/`onOpenChange`
 * so the modal can close after an async action succeeds.
 */
export function ConfirmActionButton({
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "sm",
  triggerClassName,
  disabled = false,
  disabledReason,
  triggerAriaLabel,
  modalTitle,
  modalBody,
  confirmLabel,
  pendingLabel,
  confirmVariant = "accent",
  confirmClassName,
  isPending,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: ConfirmActionButtonProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setUncontrolledOpen(next);
    }
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        disabled={disabled || isPending}
        title={disabled ? disabledReason : undefined}
        aria-label={triggerAriaLabel}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => !isPending && setOpen(false)}
        title={modalTitle}
      >
        <div className="py-4">{modalBody}</div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            className={confirmClassName}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
