import { useFormContext } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { WizardStep } from "@/components/ui/WizardStep";
import { PublishFormInput } from "@/features/forms/schemas";

export function Step1FairMetadata() {
  const { register, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep 
      title="Core FAIR Metadata" 
      description="Provide categorization details to make this schema discoverable in the STAPLE-verse market."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Domain / Discipline"
          placeholder="Select domain..."
          options={[
            { value: "psychology", label: "Psychology" },
            { value: "neuroscience", label: "Neuroscience" },
            { value: "economics", label: "Economics" },
            { value: "sociology", label: "Sociology" }
          ]}
          error={errors.domain?.message}
          {...register("domain")}
        />
        <Select
          label="Primary Language"
          placeholder="Select language..."
          options={[
            { value: "en", label: "English (US)" },
            { value: "en-gb", label: "English (UK)" },
            { value: "es", label: "Spanish" },
            { value: "fr", label: "French" },
            { value: "de", label: "German" }
          ]}
          error={errors.language?.message}
          {...register("language")}
        />
        <div className="md:col-span-2">
          <Select
            label="License"
            options={[
              { value: "CC-BY 4.0", label: "Creative Commons Attribution 4.0 (CC-BY 4.0)" },
              { value: "CC0 1.0", label: "CC0 1.0 Universal (Public Domain Dedication)" },
              { value: "MIT", label: "MIT License" }
            ]}
            helperText="Open-source licenses are required for STAPLE-verse market publication to ensure FAIR principles."
            error={errors.license?.message}
            {...register("license")}
          />
        </div>
      </div>
    </WizardStep>
  );
}
