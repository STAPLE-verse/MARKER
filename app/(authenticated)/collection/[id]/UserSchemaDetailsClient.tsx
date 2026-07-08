"use client";

import { useState } from "react";
import { FormDetailDTO, FormVersionDTO } from "@/features/forms/types";
import { BackButton } from "@/components/ui/BackButton";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { DraftPublicationMetadataCard } from "@/features/forms/components/DraftPublicationMetadataCard";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { SchemaDescriptionCard } from "@/features/forms/components/SchemaDescriptionCard";
import { OlderVersionBanner } from "@/features/forms/components/OlderVersionBanner";
import { useCloneForm } from "@/features/forms/hooks/useCloneForm";
import { useCreateFormVersion } from "@/features/forms/hooks/useCreateFormVersion";
import { VersionHistorySidebar } from "./VersionHistorySidebar";
import { SchemaDetailHeader } from "./SchemaDetailHeader";
import { SchemaViewerCard } from "./SchemaViewerCard";

interface UserSchemaDetailsClientProps {
  form: FormDetailDTO;
  selectedVersion: FormVersionDTO;
}

export default function UserSchemaDetailsClient({
  form,
  selectedVersion,
}: UserSchemaDetailsClientProps) {
  const isViewingLatest = selectedVersion.id === form.versions[0].id;
  const { clone, isCloning } = useCloneForm();
  const { createVersion, isCreating } = useCreateFormVersion(form.id);

  // History sidebar is open by default
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const publishedSchema = selectedVersion.publishedSchema;
  const isLatestDraft = isViewingLatest && selectedVersion.status === "DRAFT";
  const isHistoricalDraft = !isViewingLatest && selectedVersion.status === "DRAFT";

  return (
    <FormPageLayout
      backButton={<BackButton href="/collection">Back to Collection</BackButton>}
      sidebar={
        <VersionHistorySidebar
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          versions={form.versions}
          selectedVersion={selectedVersion}
          formId={form.id}
          onNewVersion={createVersion}
          isCreatingVersion={isCreating}
        />
      }
    >
      <SchemaDetailHeader
        formId={form.id}
        version={selectedVersion}
        isViewingLatest={isViewingLatest}
        onClone={() => clone(selectedVersion.id)}
        isCloning={isCloning}
      />

      {!isViewingLatest && <OlderVersionBanner version={selectedVersion} />}

      <div className="space-y-6 mt-8">
        <SchemaDescriptionCard schema={selectedVersion.schema} />

        <SchemaViewerCard
          schema={selectedVersion.schema}
          uiSchema={selectedVersion.uiSchema}
          isViewingLatest={isViewingLatest}
        />

        {publishedSchema && (
          <PublicationMetadataCard
            metadata={publishedSchema}
            releaseNotes={publishedSchema.releaseNotes}
          />
        )}
        {isLatestDraft && (
          <DraftPublicationMetadataCard formId={form.id} version={selectedVersion} />
        )}
        {isHistoricalDraft && (
          <PublicationMetadataCard metadata={selectedVersion.publicationMetadata} />
        )}
      </div>
    </FormPageLayout>
  );
}
