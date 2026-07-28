import { useFormContext } from "react-hook-form";
import { WizardStep } from "@/components/ui/WizardStep";
import { PublishFormInput } from "@/features/forms/schemas";
import { PublicationContributorsFields } from "@/features/forms/components/publication/PublicationContributorsFields";

export interface Step2ContributorsProps {
  isProfileIncomplete?: boolean;
}

export function Step2Contributors({ isProfileIncomplete }: Step2ContributorsProps) {
  const { register, control, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep 
      title="Contributors" 
      description="List the authors and maintainers of this schema. ORCIDs are highly recommended."
    >
      <PublicationContributorsFields
        register={register}
        control={control}
        errors={errors}
        isProfileIncomplete={isProfileIncomplete}
      />
    </WizardStep>
  );
}
