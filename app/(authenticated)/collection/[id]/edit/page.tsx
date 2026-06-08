"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SchemaEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Mock properties list to simulate schema fields building
  const [properties, setProperties] = useState([
    { id: 1, key: "participantId", type: "string", title: "Participant ID" },
    { id: 2, key: "assessmentScore", type: "integer", title: "Assessment Score" },
  ]);

  const addProperty = () => {
    setProperties([
      ...properties,
      {
        id: Date.now(),
        key: `field_${properties.length + 1}`,
        type: "string",
        title: `Field ${properties.length + 1}`,
      },
    ]);
  };

  const updateProperty = (index: number, key: string, val: string) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [key]: val };
    setProperties(updated);
  };

  const removeProperty = (id: number) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-300">
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
          <Card bordered>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-lg font-bold">Fields & Properties</CardTitle>
                <Button variant="secondary" size="sm" onClick={addProperty}>
                  + Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {properties.map((field, idx) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-end border-b border-base-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-1">
                      <Input
                        label="Property Key"
                        value={field.key}
                        onChange={(e) => updateProperty(idx, "key", e.target.value)}
                        placeholder="e.g. participant_id"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Display Title"
                        value={field.title}
                        onChange={(e) => updateProperty(idx, "title", e.target.value)}
                        placeholder="e.g. Participant ID"
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-xs">Type</span>
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateProperty(idx, "type", e.target.value)}
                        className="select select-bordered select-sm w-full max-w-xs"
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error"
                      onClick={() => removeProperty(field.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Side: Real-time JSON schema preview */}
        <div>
          <Card bordered>
            <CardBody>
              <CardTitle className="text-lg font-bold">JSON Schema Preview</CardTitle>
              <p className="text-xs text-base-content/60 mb-2">
                This is generated dynamically as you edit fields.
              </p>
              <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200">
                <pre className="text-xs font-mono text-secondary-content">
                  {JSON.stringify(
                    {
                      $schema: "http://json-schema.org/draft-07/schema#",
                      type: "object",
                      properties: properties.reduce((acc, field) => {
                        acc[field.key] = {
                          type: field.type,
                          title: field.title,
                        };
                        return acc;
                      }, {} as Record<string, any>),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
