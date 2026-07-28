"use client";

import { useState } from "react";
import { FormDetailDTO, FormVersionDTO } from "@/features/forms/types";
import { BackButton } from "@/components/ui/BackButton";
import { Alert } from "@/components/ui/Alert";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { DraftPublicationMetadataCard } from "@/features/forms/components/DraftPublicationMetadataCard";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { SchemaDescriptionCard } from "@/features/forms/components/SchemaDescriptionCard";
import { useCloneForm } from "@/features/forms/hooks/useCloneForm";
import { useCreateFormVersion } from "@/features/forms/hooks/useCreateFormVersion";
import { useRestoreFormVersion } from "@/features/forms/hooks/useRestoreFormVersion";
import { VersionHistorySidebar } from "./VersionHistorySidebar";
import { SchemaDetailHeader } from "./SchemaDetailHeader";
import { SchemaViewerCard } from "./SchemaViewerCard";

interface UserSchemaDetailsClientProps {
  form: FormDetailDTO;
  selectedVersion: FormVersionDTO;
}

function getVersionLabel(version: FormVersionDTO): string {
  return version.status === "PUBLISHED"
    ? `v${version.publishedSchema?.version || version.version}`
    : `Draft ${version.version}`;
}

export default function UserSchemaDetailsClient({
  form,
  selectedVersion,
}: UserSchemaDetailsClientProps) {
  const latestVersion = form.versions[0];
  const isViewingLatest = selectedVersion.id === latestVersion.id;
  const { clone, isCloning } = useCloneForm();
  const { createVersion, isCreating } = useCreateFormVersion(form.id);
  const { restoreVersion, isRestoring } = useRestoreFormVersion(form.id);

  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const publishedSchema = selectedVersion.publishedSchema;
  const isLatestDraft =
    !form.archived && isViewingLatest && selectedVersion.status === "DRAFT";
  const isHistoricalDraft =
    !form.archived && !isViewingLatest && selectedVersion.status === "DRAFT";

  return (
    <FormPageLayout
      backButton={
        <BackButton href={form.archived ? "/collection?tab=archived" : "/collection"}>
          {form.archived ? "Back to Archive" : "Back to Collection"}
        </BackButton>
      }
      sidebar={
        <VersionHistorySidebar
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          versions={form.versions}
          selectedVersion={selectedVersion}
          formId={form.id}
          onNewVersion={createVersion}
          isCreatingVersion={isCreating}
          readOnly={form.archived}
        />
      }
    >
      {form.archived && (
        <Alert variant="warning" title="Archived schema" className="mb-6">
          This schema is in your archive. Recover it to edit or publish again
          {form.hasPublishedVersion
            ? ". Forms with published versions cannot be permanently deleted."
            : ", or permanently delete it."}
        </Alert>
      )}

      <SchemaDetailHeader
        formId={form.id}
        version={selectedVersion}
        isViewingLatest={isViewingLatest}
        archived={form.archived}
        hasPublishedVersion={form.hasPublishedVersion}
        onClone={() => clone(selectedVersion.id)}
        isCloning={isCloning}
        onRestore={() => restoreVersion(selectedVersion.id)}
        isRestoring={isRestoring}
      />

      <div className="space-y-6 mt-8">
        <SchemaDescriptionCard schema={selectedVersion.schema} />

        <SchemaViewerCard
          schema={selectedVersion.schema}
          uiSchema={selectedVersion.uiSchema}
          latestSchema={latestVersion.schema}
          latestUiSchema={latestVersion.uiSchema}
          isViewingLatest={isViewingLatest}
          currentVersionLabel={getVersionLabel(selectedVersion)}
          latestVersionLabel={getVersionLabel(latestVersion)}
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
