import { useTransition } from "react"
import { UseFormReturn } from "react-hook-form"
import { savePublicationMetadata } from "@/features/forms/actions"
import { DraftPublicationMetadataInput } from "@/features/forms/schemas"
import type { PublicationMetadataFieldsDTO } from "@/features/forms/types"
import { runAction } from "@/lib/action"
import { applyFieldErrors } from "@/lib/form-errors"
import { toast } from "@/lib/toast"
import { toIsoTimestamp } from "@/features/forms/utils/timestamps"

interface SavePublicationMetadataOptions {
  formId: number
  formVersionId: number
  metadataUpdatedAt?: Date | string | null
  form: UseFormReturn<DraftPublicationMetadataInput>
  onSaveSuccess?: (saved: { updatedAt: string; metadata: PublicationMetadataFieldsDTO }) => void
}

export function useSavePublicationMetadata({
  formId,
  formVersionId,
  metadataUpdatedAt,
  form,
  onSaveSuccess,
}: SavePublicationMetadataOptions) {
  const [isSaving, startSaving] = useTransition()

  const save = (data: DraftPublicationMetadataInput) => {
    startSaving(async () => {
      const res = await runAction(
        savePublicationMetadata({
          ...data,
          formId,
          formVersionId,
          expectedMetadataUpdatedAt: metadataUpdatedAt
            ? toIsoTimestamp(metadataUpdatedAt)
            : undefined,
        })
      )

      if (!res.ok) {
        if (!applyFieldErrors(form, res.fieldErrors)) {
          toast.error(res.error)
        }
        return
      }

      onSaveSuccess?.(res.data)
      toast.success("Publication metadata saved")
    })
  }

  return { save, isSaving }
}
