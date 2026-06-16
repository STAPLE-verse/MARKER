"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import Link from "next/link";
import { FormWithAllVersions } from "@/features/forms/types";

interface UserSchemaDetailsClientProps {
  form: FormWithAllVersions;
}

export default function UserSchemaDetailsClient({ form }: UserSchemaDetailsClientProps) {
  const router = useRouter();
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const latestVersion = form.versions[0];
  const schemaJson = (latestVersion.schema || {}) as Record<string, unknown>;
  
  // In Phase 1, we only have Drafts
  const type: string = "Draft";
  const pid = null;

  const handlePublish = () => {
    // Real publish logic will trigger here in Phase 2
    setPublishModalOpen(false);
    router.push("/collection");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.push("/collection")} size="sm">
          ← Back to Collection
        </Button>
      </div>

      <PageHeader
        title={latestVersion.name || "Untitled Draft"}
        description={`Status: ${type} • Version: ${latestVersion.version}`}
      >
        <div className="flex gap-2">
          {type === "Draft" ? (
            <>
              <Link href={`/collection/${form.id}/edit`}>
                <Button variant="primary" outline size="sm">
                  Edit Builder
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
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-lg">Status Overview</CardTitle>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-base-content/60 font-semibold">Status</div>
                  <div className="mt-1">
                    <span
                      className={`badge ${
                        type === "Published" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {type}
                    </span>
                  </div>
                </div>
                {pid && (
                  <div>
                    <div className="text-base-content/60 font-semibold">PID (Persistent Identifier)</div>
                    <div className="font-mono text-primary mt-1">{pid}</div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* JSON Schema Definition */}
        <div className="md:col-span-2 space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">Description</CardTitle>
              <p className="text-base-content/85 leading-relaxed">{typeof schemaJson.description === "string" ? schemaJson.description : "No description provided."}</p>
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">JSON Schema Definition</CardTitle>
              <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200">
                <pre className="text-xs font-mono text-secondary-content">
                  {JSON.stringify(schemaJson, null, 2)}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Schema to Market"
      >
        <div className="py-4 space-y-3">
          <p className="text-base-content/85">
            You are about to publish <span className="font-bold text-primary">{latestVersion.name}</span>.
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
