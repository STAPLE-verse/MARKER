"use client";

import { useState } from "react";
import { FormDetailDTO } from "@/features/forms/types";
import { BackButton } from "@/components/ui/BackButton";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { SchemaDescriptionCard } from "@/features/forms/components/SchemaDescriptionCard";
import { OlderVersionBanner } from "@/features/forms/components/OlderVersionBanner";
import { useVersionSelection } from "@/features/forms/hooks/useVersionSelection";
import { useCloneForm } from "@/features/forms/hooks/useCloneForm";
import { useCreateFormVersion } from "@/features/forms/hooks/useCreateFormVersion";
import { VersionHistorySidebar } from "./VersionHistorySidebar";
import { SchemaDetailHeader } from "./SchemaDetailHeader";
import { SchemaViewerCard } from "./SchemaViewerCard";

interface UserSchemaDetailsClientProps {
  form: FormDetailDTO;
}

export default function UserSchemaDetailsClient({ form }: UserSchemaDetailsClientProps) {
  const { selectedVersion, selectVersion, isViewingLatest } = useVersionSelection(form);
  const { clone, isCloning } = useCloneForm();
  const { createVersion, isCreating } = useCreateFormVersion(form.id);

  // History sidebar is open by default
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const publishedSchema = selectedVersion.publishedSchema;

  return (
    <FormPageLayout
      backButton={<BackButton href="/collection">Back to Collection</BackButton>}
      sidebar={
        <VersionHistorySidebar
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          versions={form.versions}
          selectedVersion={selectedVersion}
          setSelectedVersion={selectVersion}
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
        {publishedSchema && <PublicationMetadataCard publishedSchema={publishedSchema} />}

        <SchemaDescriptionCard schema={selectedVersion.schema} />

        <SchemaViewerCard
          schema={selectedVersion.schema}
          uiSchema={selectedVersion.uiSchema}
          isViewingLatest={isViewingLatest}
        />
      </div>
    </FormPageLayout>
  );
}
