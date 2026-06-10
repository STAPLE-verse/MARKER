"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormStudio } from "@/features/form-builder";

export default function SchemaEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [schema, setSchema] = useState<string>("{}");
  const [uiSchema, setUiSchema] = useState<string>("{}");

  const handleSave = (state: { schema: object; uiSchema: object; formData: object }) => {
    // Note: Here you would save the state to the DB via a server action.
    // For now, we update the local state and navigate back or show a toast.
    setSchema(JSON.stringify(state.schema));
    setUiSchema(JSON.stringify(state.uiSchema));
    router.push(`/collection/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300 h-screen flex flex-col">
      <div className="mb-4 flex-none">
        <Button variant="ghost" onClick={() => router.back()} size="sm">
          ← Back
        </Button>
      </div>

      <div className="flex-none">
        <PageHeader
          title="Schema Form Studio"
          description="Design, edit, and preview your metadata template schema all in one place. Changes are saved as a draft version."
        >
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.back()} size="sm">
              Cancel
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="flex-1 w-full min-h-0 border border-base-300 p-6 rounded-box bg-base-100 shadow-xl overflow-hidden">
        <FormStudio
          initialSchema={schema}
          initialUiSchema={uiSchema}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
