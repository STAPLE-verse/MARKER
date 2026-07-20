"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useDeleteForm } from "@/features/forms/hooks/useDeleteForm";

interface DeleteFormButtonProps {
  formId: number;
  schemaTitle: string;
  /** After a successful delete, navigate here instead of refreshing the current page. */
  redirectTo?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "accent" | "ghost" | "link";
  size?: "lg" | "md" | "sm" | "xs";
  className?: string;
}

/**
 * Destructive delete control: trigger button + confirmation modal wired to
 * `deleteForm`. Drop onto a form detail/header surface when archive/delete UX
 * ships — pass `redirectTo="/collection"` from `/collection/[id]` so the user
 * leaves the deleted form's page.
 */
export function DeleteFormButton({
  formId,
  schemaTitle,
  redirectTo,
  onSuccess,
  disabled = false,
  variant = "ghost",
  size = "sm",
  className = "text-error hover:bg-error/15",
}: DeleteFormButtonProps) {
  const [open, setOpen] = useState(false);
  const { remove, isDeleting } = useDeleteForm({
    redirectTo,
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
    },
  });

  const handleDelete = () => {
    remove(formId);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isDeleting}
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>

      <Modal
        open={open}
        onClose={() => !isDeleting && setOpen(false)}
        title="Delete Metadata Schema"
      >
        <div className="py-4">
          <p className="text-base-content/85">
            Are you sure you want to delete{" "}
            <span className="font-bold text-primary">{schemaTitle}</span>? This action cannot be
            undone.
          </p>
        </div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Schema"}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
