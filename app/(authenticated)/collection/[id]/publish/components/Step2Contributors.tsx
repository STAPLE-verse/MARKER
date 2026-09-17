import { useFormContext } from "react-hook-form";
import { WizardStep } from "@/components/ui/WizardStep";
import { PublishFormInput } from "@/features/forms/schemas";
import { PublicationContributorsFields } from "@/features/forms/components/publication/PublicationContributorsFields";

export interface Step2ContributorsProps {
  isProfileIncomplete?: boolean;
  formId: number;
}

export function Step2Contributors({ isProfileIncomplete, formId }: Step2ContributorsProps) {
  const { control, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep
      title="Contributors"
      description="List the authors and maintainers of this schema. ORCIDs are highly recommended."
    >
      <PublicationContributorsFields
        control={control}
        errors={errors}
        isProfileIncomplete={isProfileIncomplete}
        formId={formId}
      />
    </WizardStep>
  );
}
