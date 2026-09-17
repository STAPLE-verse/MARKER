"use client";

import { useState } from "react";
import Link from "next/link";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { SchemaTabsCard } from "@/features/forms/components/SchemaTabsCard";
import { PublicPublishedSchemaDTO } from "@/features/forms/types";
import { PublishedVersionsSidebar } from "./PublishedVersionsSidebar";
import { ForkSchemaButton } from "./ForkSchemaButton";

interface SchemaDetailsClientProps {
  schema: PublicPublishedSchemaDTO;
  isLoggedIn: boolean;
  /** Non-null when the viewer currently has real (accepted) access to the origin form — see getViewerFormAccess. */
  viewerFormId: number | null;
  viewerVersionId: number | null;
  /** Set when this page was reached from a form's own detail page (`?fromForm=`) — "Back" returns there instead of /explore. */
  backFormId: number | null;
}

export default function SchemaDetailsClient({
  schema,
  isLoggedIn,
  viewerFormId,
  viewerVersionId,
  backFormId,
}: SchemaDetailsClientProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  // A family with only one published version has nothing to show a history
  // for — skip the sidebar entirely rather than render an empty affordance.
  const hasHistory = schema.versions.length > 1;

  return (
    <FormPageLayout
      backButton={
        backFormId != null ? (
          <BackButton href={`/collection/${backFormId}`}>Back to Schema</BackButton>
        ) : (
          <BackButton href="/explore">Back to Explore</BackButton>
        )
      }
      sidebar={
        hasHistory ? (
          <PublishedVersionsSidebar
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            versions={schema.versions}
            currentPid={schema.pid}
          />
        ) : undefined
      }
    >
      <PageHeader
        title={schema.title}
        description={`PID: ${schema.pid} • Version: ${schema.version}`}
      >
        <ForkSchemaButton
          pid={schema.pid}
          isLoggedIn={isLoggedIn}
          viewerFormId={viewerFormId}
          viewerVersionId={viewerVersionId}
        />
        <a href={`/api/schemas/${schema.pid}/package`} download={`${schema.pid}.json`}>
          <Button variant="primary" outline size="sm">
            Export JSON
          </Button>
        </a>
      </PageHeader>

      <div className="space-y-6">
        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl">Description</CardTitle>
            <p className="text-base-content/85 leading-relaxed">
              {schema.description || "No description provided."}
            </p>
            {schema.relatedPublicationDoi && (
              <p className="text-sm text-base-content/60 mt-2">
                Related publication:{" "}
                <a
                  href={`https://doi.org/${schema.relatedPublicationDoi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {schema.relatedPublicationDoi}
                </a>
              </p>
            )}
            {schema.forkedFrom && (
              <p className="text-sm text-base-content/60 mt-2">
                Forked from{" "}
                <Link href={`/schemas/${schema.forkedFrom.pid}`} className="link link-primary">
                  {schema.forkedFrom.title}
                </Link>
              </p>
            )}
          </CardBody>
        </Card>

        <PublicationMetadataCard metadata={schema} releaseNotes={schema.releaseNotes} />

        <SchemaTabsCard schema={schema.schema} uiSchema={schema.uiSchema} />
      </div>
    </FormPageLayout>
  );
}
