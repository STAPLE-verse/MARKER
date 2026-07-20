"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TabTrigger, Tabs } from "@/components/ui/Tabs";
import { SchemaSourceViewer } from "@/features/forms/components/SchemaSourceViewer";
import { SchemaPreviewPanel } from "@/features/forms/components/SchemaPreviewPanel";
import { SchemaDiffDialog } from "./SchemaDiffDialog";

interface SchemaViewerCardProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  latestSchema: Record<string, unknown>;
  latestUiSchema: Record<string, unknown>;
  isViewingLatest: boolean;
  currentVersionLabel: string;
  latestVersionLabel: string;
}

/**
 * Page-local card that toggles between the raw JSON source and the live form
 * preview.
 */
export function SchemaViewerCard({
  schema,
  uiSchema,
  latestSchema,
  latestUiSchema,
  isViewingLatest,
  currentVersionLabel,
  latestVersionLabel,
}: SchemaViewerCardProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "preview">("schema");
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [hasOpenedCompare, setHasOpenedCompare] = useState(false);

  const openCompare = () => {
    setIsCompareOpen(true);
    if (!hasOpenedCompare) {
      window.setTimeout(() => setHasOpenedCompare(true), 0);
    }
  };

  return (
    <>
      <Card bordered className="overflow-hidden">
        <CardBody className="p-0">
          <div className="border-b border-base-200 px-4 pt-4 bg-base-200 flex justify-between items-end">
            <Tabs>
              <TabTrigger
                active={activeTab === "schema"}
                onClick={() => setActiveTab("schema")}
              >
                JSON Source
              </TabTrigger>
              <TabTrigger
                active={activeTab === "preview"}
                onClick={() => setActiveTab("preview")}
              >
                Form Preview
              </TabTrigger>
            </Tabs>

            {!isViewingLatest && activeTab === "schema" && (
              <div className="pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-8 min-h-8 px-3"
                  onClick={openCompare}
                >
                  Compare to Latest
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

      {!isViewingLatest && (
        <SchemaDiffDialog
          open={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          shouldLoadViewer={hasOpenedCompare}
          currentSchema={schema}
          currentUiSchema={uiSchema}
          latestSchema={latestSchema}
          latestUiSchema={latestUiSchema}
          currentVersionLabel={currentVersionLabel}
          latestVersionLabel={latestVersionLabel}
        />
      )}
    </>
  );
}
