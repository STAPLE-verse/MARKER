"use client";

import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { useDeleteFormVersion } from "@/features/forms/hooks/useDeleteFormVersion";

interface DeleteFormVersionButtonProps {
  formId: number;
  versionId: number;
  versionLabel: string;
  versionName?: string;
  /** Navigate here after delete instead of refreshing the current route. */
  redirectTo?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Hard-deletes a single draft version (docs/form-delete-policy.md).
 * Only offered for draft versions when the form has more than one active version.
 */
export function DeleteFormVersionButton({
  formId,
  versionId,
  versionLabel,
  versionName,
  redirectTo,
  onSuccess,
  disabled = false,
  disabledReason,
}: DeleteFormVersionButtonProps) {
  const [open, setOpen] = useState(false);
  const { remove, isDeleting } = useDeleteFormVersion(formId, {
    redirectTo,
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
    },
  });

  const displayName = versionName?.trim() || "Untitled Draft";

  return (
    <ConfirmActionButton
      open={open}
      onOpenChange={setOpen}
      triggerLabel={<TrashIcon className="h-4 w-4" aria-hidden="true" />}
      triggerVariant="ghost"
      triggerSize="xs"
      triggerClassName="text-error hover:bg-error/15 shrink-0"
      triggerAriaLabel={`Delete ${versionLabel}`}
      disabled={disabled}
      disabledReason={disabledReason}
      modalTitle="Delete Draft Version"
      modalBody={
        <p className="text-base-content/85">
          Are you sure you want to delete{" "}
          <span className="font-bold text-primary">{versionLabel}</span>
          {displayName !== versionLabel && (
            <>
              {" "}
              (<span className="font-bold text-primary">{displayName}</span>)
            </>
          )}
          ? This action cannot be undone.
        </p>
      }
      confirmLabel="Delete Version"
      pendingLabel="Deleting..."
      confirmClassName="btn-error"
      isPending={isDeleting}
      onConfirm={() => remove(versionId)}
    />
  );
}
