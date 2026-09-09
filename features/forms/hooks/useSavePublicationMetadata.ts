import { useTransition } from "react"
import { UseFormReturn } from "react-hook-form"
import { savePublicationMetadata } from "@/features/forms/actions"
import { DraftPublicationMetadataInput } from "@/features/forms/schemas"
import type { PublicationMetadataFieldsDTO } from "@/features/forms/types"
import type { FieldErrors } from "@/utils/action-result"
import { runAction } from "@/lib/action"
import { applyFieldErrors } from "@/lib/form-errors"
import { toast } from "@/lib/toast"
import { toIsoTimestamp } from "@/features/forms/utils/timestamps"

interface SavePublicationMetadataOptions<TFieldValues extends DraftPublicationMetadataInput> {
  formId: number
  formVersionId: number
  metadataUpdatedAt?: Date | string | null
  form: UseFormReturn<TFieldValues>
  onSaveSuccess?: (saved: { updatedAt: string; metadata: PublicationMetadataFieldsDTO }) => void
}

/**
 * Shared save path for `PublicationMetadata`: used both by
 * `DraftPublicationMetadataCard` and by the publish wizard's Steps 1-2 (see
 * PublishSchemaClient.tsx), so there is exactly one writer for this row and
 * one optimistic-lock implementation to reason about.
 */
export function useSavePublicationMetadata<TFieldValues extends DraftPublicationMetadataInput>({
  formId,
  formVersionId,
  metadataUpdatedAt,
  form,
  onSaveSuccess,
}: SavePublicationMetadataOptions<TFieldValues>) {
  const [isSaving, startSaving] = useTransition()

  const save = (data: TFieldValues) => {
    startSaving(async () => {
      const res = await runAction(
        savePublicationMetadata({
          domain: data.domain,
          language: data.language,
          license: data.license,
          keywords: data.keywords,
          contributors: data.contributors,
          formId,
          formVersionId,
          expectedMetadataUpdatedAt: metadataUpdatedAt
            ? toIsoTimestamp(metadataUpdatedAt)
            : undefined,
        })
      )

      if (!res.ok) {
        // `res.fieldErrors` is keyed by the save action's own input shape
        // (which also includes formId/formVersionId, not real form fields);
        // only the metadata keys it shares with `TFieldValues` are ever
        // actually set on the form.
        if (!applyFieldErrors(form, res.fieldErrors as FieldErrors<TFieldValues> | undefined)) {
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
