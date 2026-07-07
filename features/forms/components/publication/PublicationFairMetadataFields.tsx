import { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form"
import { Select } from "@/components/ui/Select"
import { KeywordsInput } from "@/components/ui/KeywordsInput"
import {
  PUBLICATION_DOMAIN_OPTIONS,
  PUBLICATION_LANGUAGE_OPTIONS,
  PUBLICATION_LICENSE_OPTIONS,
} from "@/features/forms/constants/publicationMetadataOptions"

interface PublicationFairMetadataFieldsProps<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
}

export function PublicationFairMetadataFields<TFieldValues extends FieldValues>({
  register,
  control,
  errors,
}: PublicationFairMetadataFieldsProps<TFieldValues>) {
  return (
    <div className="space-y-6">
      <Select
        label="Domain / Discipline"
        placeholder="Select domain..."
        options={PUBLICATION_DOMAIN_OPTIONS}
        error={errors.domain?.message as string | undefined}
        {...register("domain" as Path<TFieldValues>)}
      />
      <Select
        label="Primary Language"
        placeholder="Select language..."
        options={PUBLICATION_LANGUAGE_OPTIONS}
        error={errors.language?.message as string | undefined}
        {...register("language" as Path<TFieldValues>)}
      />
      <Select
        label="License"
        options={PUBLICATION_LICENSE_OPTIONS}
        helperText="Open-source licenses are required for STAPLE-verse publication to ensure FAIR principles."
        error={errors.license?.message as string | undefined}
        {...register("license" as Path<TFieldValues>)}
      />
      <KeywordsInput
        name={"keywords" as Path<TFieldValues>}
        control={control}
        label="Keywords"
        placeholder="Add keywords..."
        description="Press Enter, Comma, or Semicolon to add a keyword. Required for marketplace discovery."
        errors={errors}
      />
    </div>
  )
}
