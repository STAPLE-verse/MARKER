"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SchemaSourceViewer } from "@/features/forms/components/SchemaSourceViewer";
import { SchemaPreviewPanel } from "@/features/forms/components/SchemaPreviewPanel";

interface SchemaViewerCardProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  isViewingLatest: boolean;
}

/**
 * Page-local card that toggles between the raw JSON source and the live form
 * preview. The tab chrome is kept local (not promoted to @staple-verse/ui) since
 * it has a single app-level consumer for now.
 */
export function SchemaViewerCard({ schema, uiSchema, isViewingLatest }: SchemaViewerCardProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "preview">("schema");

  return (
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
          {activeTab === "schema" && <SchemaSourceViewer schema={schema} uiSchema={uiSchema} />}
          {activeTab === "preview" && <SchemaPreviewPanel schema={schema} uiSchema={uiSchema} />}
        </div>
      </CardBody>
    </Card>
  );
}
