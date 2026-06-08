"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import Link from "next/link";

export default function UserSchemaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Mock fetching schema details from database
  const mockUserSchema = {
    id: id,
    title: id === "schema_2" ? "Cognitive Assessment Template" : "Mental Health Screening Protocol",
    description: "Private template for gathering behavioral health assessment data. Standardized for cross-institutional research studies.",
    type: id === "schema_2" ? "Published" : "Draft",
    version: id === "schema_2" ? "1.0.0" : "0.1.0",
    pid: id === "schema_2" ? "ps_cognitive_assessment" : null,
    schemaJson: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: id === "schema_2" ? "Cognitive Assessment Template" : "Mental Health Screening Protocol",
      type: "object",
      properties: {
        participantId: { type: "string" },
        screeningScore: { type: "integer" },
      },
    },
  };

  const handlePublish = () => {
    // Real publish logic will trigger here, saving to PublishedSchema table with a PID
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
        title={mockUserSchema.title}
        description={`Status: ${mockUserSchema.type} • Version: ${mockUserSchema.version}`}
      >
        <div className="flex gap-2">
          {mockUserSchema.type === "Draft" ? (
            <>
              <Link href={`/collection/${id}/edit`}>
                <Button variant="primary" outline size="sm">
                  Edit Builder
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => setPublishModalOpen(true)}>
                Publish Schema
              </Button>
            </>
          ) : (
            <Link href={`/schemas/${mockUserSchema.pid}`}>
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
                        mockUserSchema.type === "Published" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {mockUserSchema.type}
                    </span>
                  </div>
                </div>
                {mockUserSchema.pid && (
                  <div>
                    <div className="text-base-content/60 font-semibold">PID (Persistent Identifier)</div>
                    <div className="font-mono text-primary mt-1">{mockUserSchema.pid}</div>
                  </div>
                )}
                <div>
                  <div className="text-base-content/60 font-semibold">License Default</div>
                  <div className="mt-1">CC-BY-4.0</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* JSON Schema Definition */}
        <div className="md:col-span-2 space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">Description</CardTitle>
              <p className="text-base-content/85 leading-relaxed">{mockUserSchema.description}</p>
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">JSON Schema Definition</CardTitle>
              <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200">
                <pre className="text-xs font-mono text-secondary-content">
                  {JSON.stringify(mockUserSchema.schemaJson, null, 2)}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Try out our Modal component for publishing */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Schema to Market"
      >
        <div className="py-4 space-y-3">
          <p className="text-base-content/85">
            You are about to publish <span className="font-bold text-primary">{mockUserSchema.title}</span>.
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
