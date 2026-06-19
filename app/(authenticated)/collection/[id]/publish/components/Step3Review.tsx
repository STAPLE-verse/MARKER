import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/Textarea";
import { WizardStep } from "@/components/ui/WizardStep";
import { Alert } from "@/components/ui/Alert";
import { PublishFormInput } from "@/features/forms/schemas";

interface Step3ReviewProps {
  formVersion: number;
}

export function Step3Review({ formVersion }: Step3ReviewProps) {
  const { register, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep 
      title="Review & Freeze" 
      description="Finalize your release notes and permanently mint this version."
    >
      <Alert variant="info" title="Permanent Action">
        You are about to permanently publish <span className="font-bold">v{formVersion}</span>. 
        Once published, schemas are completely frozen. Any future edits will automatically branch into a new version.
      </Alert>

      <Textarea 
        label="Release Notes (Optional)"
        placeholder="Describe what is new or changed in this schema version to help researchers understand the update..."
        className="h-32 mt-6"
        error={errors.releaseNotes?.message}
        {...register("releaseNotes")}
      />
    </WizardStep>
  );
}
