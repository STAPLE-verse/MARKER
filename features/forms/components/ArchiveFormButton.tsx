"use client"

import { useState } from "react"
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton"
import { useArchiveForm } from "@/features/forms/hooks/useArchiveForm"

interface ArchiveFormButtonProps {
  formId: number
  schemaTitle: string
  hasPublishedVersion?: boolean
  /** After a successful archive, navigate here instead of refreshing the current page. */
  redirectTo?: string
  onSuccess?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "accent" | "ghost" | "link"
  size?: "lg" | "md" | "sm" | "xs"
  className?: string
}

/**
 * Archive control (Step 1; docs/form-delete-policy.md §4.3). Moves the form to
 * the Archived tab; recoverable via `unarchiveForm`.
 */
export function ArchiveFormButton({
  formId,
  schemaTitle,
  hasPublishedVersion = false,
  redirectTo = "/collection",
  onSuccess,
  disabled = false,
  variant = "ghost",
  size = "sm",
  className,
}: ArchiveFormButtonProps) {
  const [open, setOpen] = useState(false)
  const { archive, isArchiving } = useArchiveForm({
    redirectTo,
    onSuccess: () => {
      setOpen(false)
      onSuccess?.()
    },
  })

  return (
    <ConfirmActionButton
      open={open}
      onOpenChange={setOpen}
      triggerLabel="Archive"
      triggerVariant={variant}
      triggerSize={size}
      triggerClassName={className}
      disabled={disabled}
      modalTitle="Archive Schema"
      modalBody={
        <p className="text-base-content/85">
          Are you sure you want to archive{" "}
          <span className="font-bold text-primary">{schemaTitle}</span>? It will move to your
          archive and you can recover it later.
          {hasPublishedVersion &&
            " Published schemas will remain available at their public URLs."}
        </p>
      }
      confirmLabel="Archive Schema"
      pendingLabel="Archiving..."
      confirmVariant="primary"
      isPending={isArchiving}
      onConfirm={() => archive(formId)}
    />
  )
}
