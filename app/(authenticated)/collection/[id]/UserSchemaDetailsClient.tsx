"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { FormWithAllVersions } from "@/features/forms/types";
import { FormStudioProvider, FormPreview } from "@/features/form-builder";
import { VersionHistorySidebar } from "./VersionHistorySidebar";

interface UserSchemaDetailsClientProps {
  form: FormWithAllVersions;
}

export default function UserSchemaDetailsClient({ form }: UserSchemaDetailsClientProps) {
  const router = useRouter();
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "preview">("schema");
  
  // History sidebar is open by default
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(form.versions[0]);

  const isViewingLatest = selectedVersion.id === form.versions[0].id;
  const schemaJson = (selectedVersion.schema || {}) as Record<string, unknown>;
  const uiSchemaJson = (selectedVersion.uiSchema || {}) as Record<string, unknown>;
  
  // In Phase 1, we only have Drafts
  const type: string = "Draft";
  const pid = null;

  const handlePublish = () => {
    // Real publish logic will trigger here in Phase 2
    setPublishModalOpen(false);
    router.push("/collection");
  };

  return (
    <div className="relative min-h-screen bg-base-100 overflow-hidden flex">
      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto pr-16">
        
        {/* Top-Left Back Button */}
        <div className="p-4 lg:px-8 pt-6">
          <Button variant="ghost" onClick={() => router.push("/collection")} size="sm" className="text-base-content/60 hover:text-base-content">
            ← Back to Collection
          </Button>
        </div>

        <div className="container mx-auto px-4 pb-8 max-w-4xl animate-in fade-in duration-300 relative">
          
          {/* Banner for viewing older versions */}
          {!isViewingLatest && (
            <Alert variant="warning" className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <div className="text-base">
                  <span className="font-bold">Viewing older version:</span> Version {selectedVersion.version}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedVersion(form.versions[0])}>
                    Back to Latest
                  </Button>
                  <Button size="sm" variant="primary">
                    Restore this Version
                  </Button>
                  <Button size="sm" variant="secondary">
                    Clone...
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <span>{selectedVersion.name || "Untitled Draft"}</span>
                <span
                  className={`badge ${
                    type === "Published" ? "badge-success" : "badge-warning"
                  }`}
                >
                  {type}
                </span>
              </div>
            }
            description={
              <div className="flex flex-col gap-1 mt-1">
                <span>Version: {selectedVersion.version}</span>
                {pid && <span className="font-mono text-primary text-xs">PID: {pid}</span>}
              </div>
            }
          >
            <div className="flex gap-2 items-center">
              {isViewingLatest && (
                <>
                  {type === "Draft" ? (
                    <>
                      <Link href={`/collection/${form.id}/edit`}>
                        <Button variant="primary" outline size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="primary" size="sm" onClick={() => setPublishModalOpen(true)}>
                        Publish Schema
                      </Button>
                    </>
                  ) : (
                    <Link href={`/schemas/${pid}`}>
                      <Button variant="secondary" size="sm">
                        View Public URL
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </PageHeader>

          <div className="space-y-6 mt-8">
            <Card bordered>
              <CardBody>
                <CardTitle className="text-xl">Description</CardTitle>
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
                      className={`tab tab-lg ${activeTab === "schema" ? "tab-active font-semibold" : ""}`}
                      onClick={() => setActiveTab("schema")}
                    >
                      JSON Source
                    </button>
                    <button
                      className={`tab tab-lg ${activeTab === "preview" ? "tab-active font-semibold" : ""}`}
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
        </div>
      </div>

      {/* History Sidebar / Right Rail */}
      <VersionHistorySidebar 
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        versions={form.versions}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
      />

      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Schema to Market"
      >
        <div className="py-4 space-y-3">
          <p className="text-base-content/85">
            You are about to publish <span className="font-bold text-primary">{selectedVersion.name}</span>.
          </p>
          <div className="alert alert-info shadow-sm text-sm">
            <span>
              <strong>Note:</strong> Once published, schemas are <strong>immutable</strong> (frozen) to ensure research reproducibility. Updates will generate a new version identifier.
            </span>
          </div>
        </div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handlePublish}>
            Publish & Freeze Version
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
