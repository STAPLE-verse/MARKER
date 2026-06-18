"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { FormPageLayout } from "@/components/layout/FormPageLayout";

interface PublishSchemaClientProps {
  formId: number;
  formName: string;
  formVersion: number;
}

export default function PublishSchemaClient({ formId, formName, formVersion }: PublishSchemaClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Wizard State for Phase 1 Wireframe
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("");
  const [license, setLicense] = useState("CC-BY 4.0");

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePublish = async () => {
    setIsSubmitting(true);
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
                  <div className="form-control">
                    <label className="label font-semibold">Domain / Discipline</label>
                    <select className="select select-bordered w-full" value={domain} onChange={(e) => setDomain(e.target.value)}>
                      <option disabled value="">Select domain...</option>
                      <option value="psychology">Psychology</option>
                      <option value="neuroscience">Neuroscience</option>
                      <option value="economics">Economics</option>
                      <option value="sociology">Sociology</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label font-semibold">Primary Language</label>
                    <select className="select select-bordered w-full" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option disabled value="">Select language...</option>
                      <option value="en">English (US)</option>
                      <option value="en-gb">English (UK)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="form-control md:col-span-2 mt-2">
                    <label className="label font-semibold">License</label>
                    <select className="select select-bordered w-full" value={license} onChange={(e) => setLicense(e.target.value)}>
                      <option value="CC-BY 4.0">Creative Commons Attribution 4.0 (CC-BY 4.0)</option>
                      <option value="CC0 1.0">CC0 1.0 Universal (Public Domain Dedication)</option>
                      <option value="MIT">MIT License</option>
                    </select>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Open-source licenses are required for STAPLE-verse market publication to ensure FAIR principles.
                      </span>
                    </label>
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
                    <Button variant="secondary" outline size="sm">+ Add Contributor</Button>
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

                <div className="form-control mt-6">
                  <label className="label font-semibold">Release Notes (Optional)</label>
                  <textarea 
                    className="textarea textarea-bordered h-32 text-base" 
                    placeholder="Describe what is new or changed in this schema version to help researchers understand the update..."
                  ></textarea>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Wizard Navigation Footer */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1 || isSubmitting}>
            ← Back
          </Button>
          
          {currentStep < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              Continue to {currentStep === 1 ? "Contributors" : "Review"} →
            </Button>
          ) : (
            <Button variant="accent" onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="loading loading-spinner loading-sm"></span> Publishing...</>
              ) : (
                "Publish & Freeze Version"
              )}
            </Button>
          )}
        </div>
    </FormPageLayout>
  );
}
