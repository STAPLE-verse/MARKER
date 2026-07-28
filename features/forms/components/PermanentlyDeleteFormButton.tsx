"use client";

import { useState } from "react";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { usePermanentlyDeleteForm } from "@/features/forms/hooks/usePermanentlyDeleteForm";

interface PermanentlyDeleteFormButtonProps {
  formId: number;
  schemaTitle: string;
  redirectTo?: string;
  onSuccess?: () => void;
  size?: "lg" | "md" | "sm" | "xs";
}

/**
 * Hard-delete control for archived forms with no publish history
 * (docs/form-delete-policy.md §4.3 Step 2).
 */
export function PermanentlyDeleteFormButton({
  formId,
  schemaTitle,
  redirectTo = "/collection?tab=archived",
  onSuccess,
  size = "sm",
}: PermanentlyDeleteFormButtonProps) {
  const [open, setOpen] = useState(false);
  const { remove, isDeleting } = usePermanentlyDeleteForm({
    redirectTo,
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
    },
  });

  return (
    <ConfirmActionButton
      open={open}
      onOpenChange={setOpen}
      triggerLabel="Permanently Delete"
      triggerVariant="ghost"
      triggerSize={size}
      triggerClassName="text-error hover:bg-error/15"
      modalTitle="Permanently Delete Schema"
      modalBody={
        <p className="text-base-content/85">
          Are you sure you want to permanently delete{" "}
          <span className="font-bold text-primary">{schemaTitle}</span>? This removes the schema
          and all its versions with no way to recover.
        </p>
      }
      confirmLabel="Delete Permanently"
      pendingLabel="Deleting..."
      confirmClassName="btn-error"
      isPending={isDeleting}
      onConfirm={() => remove(formId)}
    />
  );
}
