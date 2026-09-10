"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { TabTrigger, Tabs } from "@/components/ui/Tabs";
import { SchemaSourceViewer } from "@/features/forms/components/SchemaSourceViewer";
import { SchemaPreviewPanel } from "@/features/forms/components/SchemaPreviewPanel";

interface SchemaTabsCardProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

/**
 * Shared JSON Source / Form Preview tabs — used by the public schema detail
 * page and the STAPLE import modal (features/forms/components/add/StapleImportModal.tsx).
 * The authenticated `SchemaViewerCard` (app/(authenticated)/collection/[id]/)
 * is a separate, page-local component with an added "Compare to Latest" diff
 * dialog that only makes sense against a draft's own MARKER version history.
 */
export function SchemaTabsCard({ schema, uiSchema }: SchemaTabsCardProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "preview">("schema");

  return (
    <Card bordered className="overflow-hidden">
      <CardBody className="p-0">
        <div className="border-b border-base-200 px-4 pt-4 bg-base-200">
          <Tabs>
            <TabTrigger active={activeTab === "schema"} onClick={() => setActiveTab("schema")}>
              JSON Source
            </TabTrigger>
            <TabTrigger active={activeTab === "preview"} onClick={() => setActiveTab("preview")}>
              Form Preview
            </TabTrigger>
          </Tabs>
        </div>

        <div className="p-6 bg-base-100">
          {activeTab === "schema" && <SchemaSourceViewer schema={schema} uiSchema={uiSchema} />}
          {activeTab === "preview" && <SchemaPreviewPanel schema={schema} uiSchema={uiSchema} />}
        </div>
      </CardBody>
    </Card>
  );
}
