"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { FormDetailDTO } from "@/features/forms/types";
import { FormStudioProvider, FormPreview } from "@/features/form-builder";
import { VersionHistorySidebar } from "./VersionHistorySidebar";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { PublicationMetadataCard } from "@/features/forms/components/PublicationMetadataCard";
import { cloneFormVersion } from "@/features/forms/actions";

interface UserSchemaDetailsClientProps {
  form: FormDetailDTO;
}

export default function UserSchemaDetailsClient({ form }: UserSchemaDetailsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schema" | "preview">("schema");
  const [isCloning, setIsCloning] = useState(false);
  
  // History sidebar is open by default
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(form.versions[0]);

  const isViewingLatest = selectedVersion.id === form.versions[0].id;
  const schemaJson = selectedVersion.schema;
  const uiSchemaJson = selectedVersion.uiSchema;
  
  // Real status from Prisma FormVersion
  const type = selectedVersion.status === "PUBLISHED" ? "Published" : "Draft";
  const publishedSchema = selectedVersion.publishedSchema;
  const pid = publishedSchema?.pid || null;

  const handleClone = async () => {
    try {
      setIsCloning(true);
      const newFormId = await cloneFormVersion({ versionId: selectedVersion.id });
      router.push(`/collection/${newFormId}`);
    } catch (error) {
      console.error("Failed to clone form", error);
      setIsCloning(false);
    }
  };

  // Real publish logic will trigger on the dedicated /publish page

  return (
    <>
      <FormPageLayout
        backButton={
          <BackButton href="/collection">
            Back to Collection
          </BackButton>
        }
        sidebar={
          <VersionHistorySidebar 
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            versions={form.versions}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
          />
        }
      >
          
          <PageHeader
            title={
              <div className="flex items-center gap-3 flex-nowrap">
                <span className="truncate" title={selectedVersion.name || "Untitled Form"}>
                  {selectedVersion.name || "Untitled Form"}
                </span>
                <Badge variant="primary" outline className="shrink-0 mt-0.5">
                  {type === "Published" ? `v${publishedSchema?.version || selectedVersion.version}` : `Draft ${selectedVersion.version}`}
                </Badge>
                <Badge variant={type === "Published" ? "success" : "warning"} className="shrink-0 mt-0.5">
                  {type}
                </Badge>
              </div>
            }
            description={
              pid ? <span className="font-mono text-primary text-xs">PID: {pid}</span> : null
            }
          >
            <div className="flex gap-2 items-center">
              <Button variant="secondary" outline size="sm" onClick={handleClone} disabled={isCloning}>
                {isCloning ? "Cloning..." : "Clone"}
              </Button>
              {isViewingLatest && (
                <>
                  {type === "Draft" ? (
                    <>
                      <Link href={`/collection/${form.id}/edit`}>
                        <Button variant="primary" outline size="sm">
                          Edit Structure
                        </Button>
                      </Link>
                      <Link href={`/collection/${form.id}/publish`}>
                        <Button variant="primary" size="sm">
                          Publish Schema
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {pid && (
                        <Link href={`/schemas/${pid}`}>
                          <Button variant="secondary" size="sm">
                            View Public URL
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </PageHeader>

          {/* Banner for viewing older versions */}
          {!isViewingLatest && (
            <Alert variant="warning" className="mb-6 mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <div className="text-base">
                  <span className="font-bold">Viewing older version:</span> {type === "Published" ? `v${publishedSchema?.version} (Release)` : `Draft ${selectedVersion.version}`}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="primary">
                    Restore this Version
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          <div className="space-y-6 mt-8">
            {publishedSchema && <PublicationMetadataCard publishedSchema={publishedSchema} />}

            <Card bordered>
              <CardBody>
                <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Description</CardTitle>
                <p className="text-base-content/85 leading-relaxed">
                  {typeof schemaJson.description === "string" ? schemaJson.description : "No description provided."}
                </p>
              </CardBody>
            </Card>

            <Card bordered className="overflow-hidden">
              <CardBody className="p-0">
                <div className="border-b border-base-200 px-4 pt-4 bg-base-200 flex justify-between items-end">
                  <div className="tabs tabs-bordered">
                    <button
                      className={`tab tab-lg transition-all font-semibold ${activeTab === "schema" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
                      onClick={() => setActiveTab("schema")}
                    >
                      JSON Source
                    </button>
                    <button
                      className={`tab tab-lg transition-all font-semibold ${activeTab === "preview" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
                      onClick={() => setActiveTab("preview")}
                    >
                      Form Preview
                    </button>
                  </div>
                  
                  {!isViewingLatest && activeTab === "schema" && (
                    <div className="pb-2">
                      <Button variant="ghost" size="sm" className="text-primary h-8 min-h-8 px-3">
                        Compare to Latest (Coming soon)
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-base-100">
                  {activeTab === "schema" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-base-content/70 ml-1">Data Schema</h3>
                        <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200 h-[500px]">
                          <pre className="text-sm font-mono text-secondary-content">
                            {JSON.stringify(schemaJson, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-base-content/70 ml-1">UI Schema</h3>
                        <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200 h-[500px]">
                          <pre className="text-sm font-mono text-secondary-content">
                            {JSON.stringify(uiSchemaJson, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "preview" && (
                    <div className="border border-base-200 rounded-lg p-6 bg-base-50">
                      <FormStudioProvider initialSchema={schemaJson} initialUiSchema={uiSchemaJson}>
                        <FormPreview />
                      </FormStudioProvider>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
      </FormPageLayout>
    </>
  );
}
