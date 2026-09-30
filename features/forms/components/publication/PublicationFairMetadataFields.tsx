import { Control, Controller, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form"
import { Select } from "@/components/ui/Select"
import { SearchableSelect } from "@/components/ui/SearchableSelect"
import { KeywordsInput } from "@/components/ui/KeywordsInput"
import { InfoTooltip } from "@/components/ui/InfoTooltip"
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
      {/* Domain and language are long standard lists (OECD fields, ISO
          languages), so they're type-to-search rather than plain dropdowns. */}
      <Controller
        control={control}
        name={"domain" as Path<TFieldValues>}
        render={({ field }) => (
          <SearchableSelect
            label={
              <span className="inline-flex items-center gap-1.5">
                Domain / Discipline
                <InfoTooltip text="The research field this template is for. People use it to filter the Explore catalog. The choices are the OECD Fields of Science, a standard list of 42 fields used by funders and data repositories." />
              </span>
            }
            placeholder="Type to search research fields..."
            options={PUBLICATION_DOMAIN_OPTIONS}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.domain?.message as string | undefined}
          />
        )}
      />
      <Controller
        control={control}
        name={"language" as Path<TFieldValues>}
        render={({ field }) => (
          <SearchableSelect
            label={
              <span className="inline-flex items-center gap-1.5">
                Primary Language
                <InfoTooltip text="The language the template's questions and instructions are written in, not the language of the data collected with it. The choices are the standard ISO 639-1 languages." />
              </span>
            }
            placeholder="Type to search languages..."
            options={PUBLICATION_LANGUAGE_OPTIONS}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.language?.message as string | undefined}
          />
        )}
      />
      <Select
        label={
          <span className="inline-flex items-center gap-1.5">
            License
            <InfoTooltip text="The terms under which others may reuse this template. An open license is required for STAPLE-verse publication, in line with the FAIR principles. It cannot be changed for a version once published." />
          </span>
        }
        options={PUBLICATION_LICENSE_OPTIONS}
        error={errors.license?.message as string | undefined}
        {...register("license" as Path<TFieldValues>)}
      />
      <KeywordsInput
        name={"keywords" as Path<TFieldValues>}
        control={control}
        label={
          <span className="inline-flex items-center gap-1.5">
            Keywords
            <InfoTooltip text="Words or short phrases people might search for. They are matched by the Explore search and shown on the template's card. Required for discovery." />
          </span>
        }
        placeholder="Add keywords..."
        description="Press Enter, Comma, or Semicolon to add a keyword."
        errors={errors}
      />
    </div>
  )
}
