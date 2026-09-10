"use client";

import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "link";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant?: ButtonVariant;
  confirmClassName?: string;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * The styled confirm/cancel modal shared by every consequential action in
 * MARKER (archive, delete, delete version — see ConfirmActionButton, which
 * wraps this with its own trigger button). Extracted as its own component
 * for flows that already have a trigger of their own (e.g. an "Import"
 * button in a wizard/modal step) and just need to interject this same
 * confirmation before proceeding, instead of a bespoke dialog or
 * window.confirm().
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  pendingLabel,
  confirmVariant = "accent",
  confirmClassName,
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={() => !isPending && onClose()} title={title}>
      <div className="py-4">{body}</div>
      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
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
  );
}
