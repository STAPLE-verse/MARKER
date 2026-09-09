import { notFound } from "next/navigation";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { getPublishedSchemaByPid } from "@/features/forms/queries";
import { SchemaTabsCard } from "./SchemaTabsCard";

export default async function SchemaDetailsPage({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const schema = await getPublishedSchemaByPid(pid);

  if (!schema) notFound();

  return (
    <FormPageLayout
      backButton={<BackButton href="/explore">Back to Explore</BackButton>}
    >
      <PageHeader
        title={schema.title}
        description={`PID: ${schema.pid} • Version: ${schema.version}`}
      >
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
          </CardBody>
        </Card>

        <PublicationMetadataCard metadata={schema} releaseNotes={schema.releaseNotes} />

        <SchemaTabsCard schema={schema.schema} uiSchema={schema.uiSchema} />
      </div>
    </FormPageLayout>
  );
}
