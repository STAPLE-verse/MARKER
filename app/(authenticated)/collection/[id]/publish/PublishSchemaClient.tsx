"use client";

import { useState } from "react";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Form } from "@/components/ui/Form";
import { Stepper } from "@/components/ui/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { publishFormSchema, PublishFormInput } from "@/features/forms/schemas";
import { usePublishSchema } from "@/features/forms/hooks/usePublishSchema";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import { FormVersionDTO } from "@/features/forms/types";
import {
  DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
  publicationMetadataToFormValues,
} from "@/features/forms/utils/publicationMetadata";
import { extractSchemaDescription } from "@/utils/schema";
import { Step1FairMetadata } from "./components/Step1FairMetadata";
import { Step2Contributors } from "./components/Step2Contributors";
import { Step3Review } from "./components/Step3Review";

interface PublishSchemaClientProps {
  formId: number;
  version: FormVersionDTO;
  currentUser: {
    name: string;
    orcid: string;
    isProfileIncomplete: boolean;
  };
}

export default function PublishSchemaClient({ formId, version, currentUser }: PublishSchemaClientProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const publicationMetadata = version.publicationMetadata;
  const publicationMetadataDefaults = publicationMetadataToFormValues(publicationMetadata, {
    fallbackContributors: [{
      name: currentUser.name,
      roles: [DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE],
      orcid: currentUser.orcid,
    }],
  });

  const form = useForm<PublishFormInput>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      ...publicationMetadataDefaults,
      version: "1.0.0",
      // Starting point only — most templates' catalog description will
      // begin close to the form's own description and get expanded from
      // there, but the two are independently editable from here on.
      description: extractSchemaDescription(version.schema),
      releaseNotes: "",
      relatedPublicationDoi: ""
    }
  });

  const { publish, isPublishing } = usePublishSchema(formId, version.id, version.updatedAt, form);

  const handleNext = async () => {
    // Manually trigger validation on the current step fields before proceeding
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger(["domain", "language", "license", "keywords"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger(["contributors"]);
    }
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePublish = (data: PublishFormInput) => {
    if (currentStep !== 3) return;
    publish(data);
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
          title={<SchemaHeaderTitle version={version} prefix="Publishing" />}
        />

        <div className="w-full flex justify-center mb-6 mt-2">
          <Stepper 
            steps={["FAIR Metadata", "Contributors", "Review & Freeze"]}
            currentStep={currentStep}
            className="w-full max-w-2xl"
          />
        </div>

        <Form 
          form={form} 
          onSubmit={handlePublish}
          onKeyDown={(e) => {
            // Prevent Enter key from implicitly submitting the entire form on steps 1 and 2
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
              if (currentStep < 3) {
                handleNext();
              } else {
                form.handleSubmit(handlePublish)();
              }
            }
          }}
        >
          {/* Main Wizard Container */}
          <Card bordered className="flex-1 shadow-sm overflow-visible mb-6">
            <CardBody className="p-6 md:p-10">
              {currentStep === 1 && <Step1FairMetadata />}
              {currentStep === 2 && <Step2Contributors isProfileIncomplete={currentUser.isProfileIncomplete} />}
              {currentStep === 3 && <Step3Review />}
            </CardBody>
          </Card>

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1 || isPublishing} type="button">
              ← Back
            </Button>
            
            {currentStep < 3 ? (
              <Button 
                variant="primary" 
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).blur();
                  handleNext();
                }} 
                type="button"
              >
                Continue to {currentStep === 1 ? "Contributors" : "Review"} →
              </Button>
            ) : (
              <Button 
                variant="accent" 
                type="button" 
                onClick={form.handleSubmit(handlePublish)} 
                disabled={isPublishing}
              >
                {isPublishing ? (
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
