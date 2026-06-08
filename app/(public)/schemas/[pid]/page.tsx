"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle, CardActions } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SchemaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pid = params.pid as string;

  // Real implementations will fetch this schema from Prisma via server action
  const mockSchema = {
    pid: pid,
    title: pid === "ps_cognitive_assessment" ? "Cognitive Assessment Template" : "Metadata Schema Template",
    description: "Standard protocol including memory recall, verbal fluency, and executive function mapping. Standardized for cross-institutional research studies.",
    version: "1.0.0",
    author: "Dr. Jane Doe",
    license: "CC-BY-4.0",
    keywords: ["cognitive", "psychology", "assessment", "clinical-trial"],
    schemaJson: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Cognitive Assessment Template",
      type: "object",
      properties: {
        participantId: {
          type: "string",
          title: "Participant ID",
        },
        assessmentDate: {
          type: "string",
          format: "date",
          title: "Assessment Date",
        },
        memoryScore: {
          type: "integer",
          minimum: 0,
          maximum: 30,
          title: "Memory Recall Score",
        },
        verbalFluencyScore: {
          type: "integer",
          minimum: 0,
          title: "Verbal Fluency Score",
        },
      },
      required: ["participantId", "assessmentDate"],
    },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} size="sm">
          ← Back to Explore
        </Button>
      </div>

      <PageHeader
        title={mockSchema.title}
        description={`PID: ${mockSchema.pid} • Version: ${mockSchema.version}`}
      >
        <div className="flex gap-2">
          <Button variant="primary" outline size="sm">
            Export JSON
          </Button>
          <Button variant="primary" size="sm">
            Import to STAPLE
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-lg">Metadata</CardTitle>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-base-content/60 font-semibold">Author</div>
                  <div className="text-base-content font-medium">{mockSchema.author}</div>
                </div>
                <div>
                  <div className="text-base-content/60 font-semibold">License</div>
                  <div>
                    <span className="badge badge-accent badge-sm font-mono">
                      {mockSchema.license}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-base-content/60 font-semibold">Keywords</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mockSchema.keywords.map((kw) => (
                      <span key={kw} className="badge badge-ghost badge-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card bordered className="bg-info/5 border-info/20">
            <CardBody>
              <CardTitle className="text-lg text-info">FAIR Principles</CardTitle>
              <p className="text-xs text-base-content/80 leading-relaxed">
                This schema possesses a persistent identifier (PID), is explicitly licensed for reuse, and offers structured schema definitions for interoperability.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Schema Content */}
        <div className="md:col-span-2 space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">Description</CardTitle>
              <p className="text-base-content/85 leading-relaxed">{mockSchema.description}</p>
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl">JSON Schema Definition</CardTitle>
              <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200">
                <pre className="text-xs font-mono text-secondary-content">
                  {JSON.stringify(mockSchema.schemaJson, null, 2)}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
