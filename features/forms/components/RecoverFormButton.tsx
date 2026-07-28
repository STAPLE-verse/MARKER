"use client";

import { useState } from "react";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { useUnarchiveForm } from "@/features/forms/hooks/useUnarchiveForm";

interface RecoverFormButtonProps {
  formId: number;
  schemaTitle: string;
  redirectTo?: string;
  onSuccess?: () => void;
  size?: "lg" | "md" | "sm" | "xs";
}

/**
 * Restores an archived form to the active collection
 * (inverse of `archiveForm`; docs/form-delete-policy.md §4.3 Step 1).
 */
export function RecoverFormButton({
  formId,
  schemaTitle,
  redirectTo,
  onSuccess,
  size = "sm",
}: RecoverFormButtonProps) {
  const [open, setOpen] = useState(false);
  const { recover, isRecovering } = useUnarchiveForm({
    redirectTo: redirectTo ?? `/collection/${formId}`,
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
    },
  });

  return (
    <ConfirmActionButton
      open={open}
      onOpenChange={setOpen}
      triggerLabel="Recover"
      triggerVariant="primary"
      triggerSize={size}
      modalTitle="Recover Schema"
      modalBody={
        <p className="text-base-content/85">
          Are you sure you want to recover{" "}
          <span className="font-bold text-primary">{schemaTitle}</span>? It will be moved back to
          your active collection.
        </p>
      }
      confirmLabel="Recover Schema"
      pendingLabel="Recovering..."
      confirmVariant="primary"
      isPending={isRecovering}
      onConfirm={() => recover(formId)}
    />
  );
}
