import { ArrayPath, Control, FieldArray, FieldErrors, FieldValues, Path, UseFormRegister, useFieldArray } from "react-hook-form"
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS } from "@/features/forms/constants/publicationMetadataOptions"
import { DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE } from "@/features/forms/utils/publicationMetadata"

interface PublicationContributorsFieldsProps<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
  isProfileIncomplete?: boolean
}

export function PublicationContributorsFields<TFieldValues extends FieldValues>({
  register,
  control,
  errors,
  isProfileIncomplete,
}: PublicationContributorsFieldsProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "contributors" as ArrayPath<TFieldValues>,
  })
  const contributorErrors = errors.contributors as
    | { message?: string; name?: { message?: string }; role?: { message?: string }; orcid?: { message?: string } }[]
    | undefined

  return (
    <div className="space-y-4">
      {isProfileIncomplete && (
        <Alert variant="warning" title="Incomplete Profile">
          Your profile is missing some details (like your name or ORCID). We recommend updating your account settings to automatically pre-fill this information in the future.
        </Alert>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start bg-base-200/50 p-4 rounded-xl border border-base-300">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              {...register(`contributors.${index}.name` as Path<TFieldValues>)}
              error={contributorErrors?.[index]?.name?.message}
            />
            <Select
              label="Role"
              options={PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS}
              {...register(`contributors.${index}.role` as Path<TFieldValues>)}
              error={contributorErrors?.[index]?.role?.message}
            />
            <Input
              label="ORCID (Optional)"
              placeholder="0000-0000-0000-0000"
              {...register(`contributors.${index}.orcid` as Path<TFieldValues>)}
              error={contributorErrors?.[index]?.orcid?.message}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-9 text-error hover:bg-error/10 px-2"
            onClick={() => remove(index)}
            title="Remove Contributor"
          >
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      ))}

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="secondary"
          outline
          size="sm"
          onClick={() =>
            append({
              name: "",
              role: DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
              orcid: "",
            } as FieldArray<TFieldValues, ArrayPath<TFieldValues>>)
          }
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Contributor
        </Button>
      </div>
      {typeof errors.contributors?.message === "string" && (
        <p className="text-error text-sm text-center mt-2">{errors.contributors.message}</p>
      )}
    </div>
  )
}
