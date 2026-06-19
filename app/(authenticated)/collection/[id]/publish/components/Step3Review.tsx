import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/Textarea";
import { WizardStep } from "@/components/ui/WizardStep";
import { Alert } from "@/components/ui/Alert";
import { PublishFormInput } from "@/features/forms/schemas";
import { SemanticVersionInput } from "@/components/ui/SemanticVersionInput";
import { Control } from "react-hook-form";

interface Step3ReviewProps {
  formVersion: number;
}

export function Step3Review({ formVersion }: Step3ReviewProps) {
  const { register, control, formState: { errors } } = useFormContext<PublishFormInput>();

  return (
    <WizardStep 
      title="Review & Freeze" 
      description="Finalize your release notes and permanently mint this version."
    >
      <Alert variant="info" title="Permanent Action">
        You are about to permanently publish your draft schema. 
        Once published, this version will be completely frozen. Any future edits will automatically branch into a new draft revision.
      </Alert>

      <div className="mt-6">
        <SemanticVersionInput 
          name="version"
          control={control as Control<any>}
          label="Semantic Release Version"
          description="Use Major.Minor.Patch format (e.g. 1.0.0)."
          errors={errors}
        />
      </div>

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
