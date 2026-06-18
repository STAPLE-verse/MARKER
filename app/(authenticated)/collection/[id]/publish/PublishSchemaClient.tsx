"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Form } from "@/components/ui/Form";
import { Stepper } from "@/components/ui/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { publishFormSchema, PublishFormInput } from "@/features/forms/schemas";
import { Step1FairMetadata } from "./components/Step1FairMetadata";
import { Step2Contributors } from "./components/Step2Contributors";
import { Step3Review } from "./components/Step3Review";

interface PublishSchemaClientProps {
  formId: number;
  formName: string;
  formVersion: number;
}

export default function PublishSchemaClient({ formId, formName, formVersion }: PublishSchemaClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PublishFormInput>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      domain: "",
      language: "",
      license: "CC-BY 4.0",
      releaseNotes: ""
    }
  });

  const handleNext = async () => {
    // Manually trigger validation on the current step fields before proceeding
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger(["domain", "language", "license"]);
    } else if (currentStep === 2) {
      // Step 2 is contributors (placeholder)
      isValid = true;
    }
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePublish = async (data: any) => {
    setIsSubmitting(true);
    console.log("Publishing form with data:", data);
    // Real publishing logic and form state aggregation will go here in Phase 2
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/collection/${formId}`);
    }, 1500);
  };

  return (
    <FormPageLayout
      backButton={
        <BackButton href={`/collection/${formId}`}>
          Cancel Publishing
        </BackButton>
      }
    >
        <PageHeader
          title={
            <div className="flex items-center gap-3 flex-nowrap">
              <span className="truncate" title={`Publishing: ${formName}`}>
                <span className="text-base-content/50 font-normal">Publishing:</span> {formName}
              </span>
              <Badge variant="primary" outline className="shrink-0 mt-0.5">
                v{formVersion}
              </Badge>
            </div>
          }
        />

        <div className="w-full flex justify-center mb-6 mt-2">
          <Stepper 
            steps={["FAIR Metadata", "Contributors", "Review & Freeze"]}
            currentStep={currentStep}
            className="w-full max-w-2xl"
          />
        </div>

        <Form form={form} onSubmit={handlePublish}>
          {/* Main Wizard Container */}
          <Card bordered className="flex-1 shadow-sm overflow-visible mb-6">
            <CardBody className="p-6 md:p-10">
              {currentStep === 1 && <Step1FairMetadata />}
              {currentStep === 2 && <Step2Contributors />}
              {currentStep === 3 && <Step3Review formVersion={formVersion} />}
            </CardBody>
          </Card>

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1 || isSubmitting} type="button">
              ← Back
            </Button>
            
            {currentStep < 3 ? (
              <Button variant="primary" onClick={handleNext} type="button">
                Continue to {currentStep === 1 ? "Contributors" : "Review"} →
              </Button>
            ) : (
              <Button variant="accent" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><span className="loading loading-spinner loading-sm"></span> Publishing...</>
                ) : (
                  "Publish & Freeze Version"
                )}
              </Button>
            )}
          </div>
        </Form>
    </FormPageLayout>
  );
}
