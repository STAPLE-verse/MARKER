"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormBuilder } from "@/features/form-builder";

export default function SchemaEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [schema, setSchema] = useState<string>("{}");
  const [uiSchema, setUiSchema] = useState<string>("{}");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} size="sm">
          ← Back
        </Button>
      </div>

      <PageHeader
        title="Schema Form Builder"
        description="Design your metadata template schema visually. Changes are saved as a draft version."
      >
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push(`/collection/${id}`)}>
            Save Draft
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Builder interface */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-base-300 p-6 rounded-box bg-base-100 shadow-xl">
            <FormBuilder
              schema={schema}
              uischema={uiSchema}
              onChange={(newSchema: string, newUiSchema: string) => {
                setSchema(newSchema);
                setUiSchema(newUiSchema);
              }}
            />
          </div>
        </div>

        {/* Right Side: Real-time JSON schema preview */}
        <div className="space-y-6">
          <div className="border border-base-300 p-6 rounded-box bg-base-100 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-secondary">JSON Schema Preview</h2>
            <div className="bg-base-200 p-4 rounded-box overflow-x-auto max-h-[300px]">
              <pre className="text-xs font-mono text-base-content/80">
                {JSON.stringify(JSON.parse(schema || "{}"), null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="border border-base-300 p-6 rounded-box bg-base-100 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-secondary">UI Schema Preview</h2>
            <div className="bg-base-200 p-4 rounded-box overflow-x-auto max-h-[300px]">
              <pre className="text-xs font-mono text-base-content/80">
                {JSON.stringify(JSON.parse(uiSchema || "{}"), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
