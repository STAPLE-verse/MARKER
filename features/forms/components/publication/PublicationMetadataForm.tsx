import { FieldValues, UseFormReturn } from "react-hook-form"
import { PublicationContributorsFields } from "./PublicationContributorsFields"
import { PublicationFairMetadataFields } from "./PublicationFairMetadataFields"

interface PublicationMetadataFormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>
  isProfileIncomplete?: boolean
  /** Feeds contributor suggestions (docs/refactor/form-collaboration.md §4.7); omit to skip them. */
  formId?: number
}

export function PublicationMetadataForm<TFieldValues extends FieldValues>({
  form,
  isProfileIncomplete,
  formId,
}: PublicationMetadataFormProps<TFieldValues>) {
  const { register, control, formState: { errors } } = form

  return (
    <div className="space-y-8">
      <PublicationFairMetadataFields
        register={register}
        control={control}
        errors={errors}
      />
      <PublicationContributorsFields
        control={control}
        errors={errors}
        isProfileIncomplete={isProfileIncomplete}
        formId={formId}
      />
    </div>
  )
}
