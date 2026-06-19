import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { WizardStep } from "@/components/ui/WizardStep";
import { Alert } from "@/components/ui/Alert";
import { PublishFormInput } from "@/features/forms/schemas";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export interface Step2ContributorsProps {
  isProfileIncomplete?: boolean;
}

export function Step2Contributors({ isProfileIncomplete }: Step2ContributorsProps) {
  const { register, control, formState: { errors } } = useFormContext<PublishFormInput>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "contributors"
  });

  return (
    <WizardStep 
      title="Contributors" 
      description="List the authors and maintainers of this schema. ORCIDs are highly recommended."
    >
      {isProfileIncomplete && (
        <Alert variant="warning" title="Incomplete Profile">
          Your profile is missing some details (like your name or ORCID). We recommend updating your account settings to automatically pre-fill this information in the future.
        </Alert>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-start bg-base-200/50 p-4 rounded-xl border border-base-300">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                {...register(`contributors.${index}.name` as const)}
                error={errors.contributors?.[index]?.name?.message}
              />
              <Select
                label="Role"
                options={[
                  { value: "Author", label: "Author" },
                  { value: "Maintainer", label: "Maintainer" },
                  { value: "Translator", label: "Translator" },
                  { value: "Data Curator", label: "Data Curator" }
                ]}
                {...register(`contributors.${index}.role` as const)}
                error={errors.contributors?.[index]?.role?.message}
              />
              <Input
                label="ORCID (Optional)"
                placeholder="0000-0000-0000-0000"
                {...register(`contributors.${index}.orcid` as const)}
                error={errors.contributors?.[index]?.orcid?.message}
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
      </div>

      <div className="flex justify-center pt-2">
        <Button 
          type="button" 
          variant="secondary" 
          outline 
          size="sm"
          onClick={() => append({ name: "", role: "Author", orcid: "" })}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Contributor
        </Button>
      </div>
      {errors.contributors?.message && (
        <p className="text-error text-sm text-center mt-2">{errors.contributors.message}</p>
      )}
    </WizardStep>
  );
}
