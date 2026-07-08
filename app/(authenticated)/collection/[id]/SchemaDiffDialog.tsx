"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const SchemaJsonDiffViewer = dynamic(() => import("./SchemaJsonDiffViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-base-300 bg-base-200 text-sm text-base-content/60">
      Loading comparison...
    </div>
  ),
});

type DiffTarget = "schema" | "uiSchema";

interface SchemaDiffDialogProps {
  open: boolean;
  onClose: () => void;
  shouldLoadViewer: boolean;
  currentSchema: Record<string, unknown>;
  currentUiSchema: Record<string, unknown>;
  latestSchema: Record<string, unknown>;
  latestUiSchema: Record<string, unknown>;
  currentVersionLabel: string;
  latestVersionLabel: string;
}

export function SchemaDiffDialog({
  open,
  onClose,
  shouldLoadViewer,
  currentSchema,
  currentUiSchema,
  latestSchema,
  latestUiSchema,
  currentVersionLabel,
  latestVersionLabel,
}: SchemaDiffDialogProps) {
  const [target, setTarget] = useState<DiffTarget>("schema");

  const currentSchemaJson = useMemo(() => JSON.stringify(currentSchema, null, 2), [currentSchema]);
  const currentUiSchemaJson = useMemo(
    () => JSON.stringify(currentUiSchema, null, 2),
    [currentUiSchema]
  );
  const latestSchemaJson = useMemo(() => JSON.stringify(latestSchema, null, 2), [latestSchema]);
  const latestUiSchemaJson = useMemo(
    () => JSON.stringify(latestUiSchema, null, 2),
    [latestUiSchema]
  );

  const original = target === "schema" ? currentSchemaJson : currentUiSchemaJson;
  const modified = target === "schema" ? latestSchemaJson : latestUiSchemaJson;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      className="flex h-[calc(100vh-4rem)] w-[min(92vw,72rem)] max-w-[min(92vw,72rem)] flex-col overflow-hidden p-0"
    >
      <div className="flex flex-col gap-4 border-b border-base-300 px-6 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">Compare to Latest</h3>
          <p className="text-sm text-base-content/60">
            {currentVersionLabel} compared with {latestVersionLabel}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="border-b border-base-300 px-6 pt-3">
        <div className="tabs tabs-bordered">
          <button
            className={`tab tab-lg font-semibold ${target === "schema" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
            onClick={() => setTarget("schema")}
          >
            Data Schema
          </button>
          <button
            className={`tab tab-lg font-semibold ${target === "uiSchema" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
            onClick={() => setTarget("uiSchema")}
          >
            UI Schema
          </button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 p-4">
        {shouldLoadViewer && (
          <SchemaJsonDiffViewer
            isOpen={open}
            target={target}
            original={original}
            modified={modified}
          />
        )}
      </div>
    </Modal>
  );
}
