"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { useForm } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Form } from "@/components/ui/Form";

interface PublishSchemaClientProps {
  formId: number;
  formName: string;
  formVersion: number;
}

export default function PublishSchemaClient({ formId, formName, formVersion }: PublishSchemaClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      domain: "",
      language: "",
      license: "CC-BY 4.0",
      releaseNotes: ""
    }
  });

  const { register } = form;

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
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

        {/* DaisyUI Stepper */}
        <div className="w-full flex justify-center mb-6 mt-2">
          <ul className="steps w-full max-w-2xl">
            <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>FAIR Metadata</li>
            <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>Contributors</li>
            <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>Review & Freeze</li>
          </ul>
        </div>

        <Form form={form} onSubmit={handlePublish}>
          {/* Main Wizard Container */}
          <Card bordered className="flex-1 shadow-sm overflow-visible mb-6">
            <CardBody className="p-6 md:p-10">
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-2xl font-bold">Core FAIR Metadata</h2>
                    <p className="text-base-content/70 mt-1">
                      Provide categorization details to make this schema discoverable in the STAPLE-verse market.
                    </p>
                  </div>
                  
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
                        {...register("license")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-2xl font-bold">Contributors</h2>
                    <p className="text-base-content/70 mt-1">
                      List the authors and maintainers of this schema. ORCIDs are highly recommended.
                    </p>
                  </div>
                  
                  {/* Placeholder for the complex array builder */}
                  <div className="border-2 border-dashed border-base-300 rounded-xl p-8 bg-base-50/50 flex flex-col justify-center items-center h-56 transition-colors hover:border-primary/50">
                    <div className="text-center">
                      <p className="text-base-content/40 font-mono text-sm mb-4">{"<ContributorArrayBuilder />"}</p>
                      <Button variant="secondary" outline size="sm" type="button">+ Add Contributor</Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h2 className="text-2xl font-bold">Review & Freeze</h2>
                    <p className="text-base-content/70 mt-1">
                      Finalize your release notes and permanently mint this version.
                    </p>
                  </div>
                  
                  <div className="alert alert-info shadow-sm bg-info/10 border border-info/20 text-info-content">
                    <div>
                      <h3 className="font-bold">Permanent Action</h3>
                      <div className="text-sm">
                        You are about to permanently publish <span className="font-bold">v{formVersion}</span>. 
                        Once published, schemas are completely frozen. Any future edits will automatically branch into a new version.
                      </div>
                    </div>
                  </div>

                  <Textarea 
                    label="Release Notes (Optional)"
                    placeholder="Describe what is new or changed in this schema version to help researchers understand the update..."
                    className="h-32 mt-6"
                    {...register("releaseNotes")}
                  />
                </div>
              )}
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
