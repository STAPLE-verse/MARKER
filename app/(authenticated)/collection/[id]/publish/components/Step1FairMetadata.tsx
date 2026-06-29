import { useFormContext } from "react-hook-form";
import { WizardStep } from "@/components/ui/WizardStep";
import { PublishFormInput } from "@/features/forms/schemas";
import { PublicationFairMetadataFields } from "@/features/forms/components/publication/PublicationFairMetadataFields";

export function Step1FairMetadata() {
  const { register, control, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep 
      title="Core FAIR Metadata" 
      description="Provide categorization details to make this schema discoverable in the STAPLE-verse market."
    >
      <PublicationFairMetadataFields register={register} control={control} errors={errors} />
    </WizardStep>
  );
}
