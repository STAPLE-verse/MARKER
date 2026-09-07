import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { WizardStep } from "@/components/ui/WizardStep";
import { Alert } from "@/components/ui/Alert";
import { PublishFormInput } from "@/features/forms/schemas";
import { VersionInput } from "@/components/ui/VersionInput";

export function Step3Review() {
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
        <VersionInput
          name="version"
          control={control}
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

      <div className="mt-6">
        <Input
          label="Related Publication DOI (Optional)"
          placeholder="e.g. 10.1000/xyz123"
          helperText="Link this schema to a published paper or dataset to strengthen its provenance."
          error={errors.relatedPublicationDoi?.message}
          {...register("relatedPublicationDoi")}
        />
      </div>
    </WizardStep>
  );
}
