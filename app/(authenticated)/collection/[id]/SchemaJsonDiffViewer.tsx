"use client";

import { useCallback, useEffect, useRef } from "react";
import { DiffEditor, type MonacoDiffEditor } from "@monaco-editor/react";

interface SchemaJsonDiffViewerProps {
  isOpen: boolean;
  target: "schema" | "uiSchema";
  original: string;
  modified: string;
}

export default function SchemaJsonDiffViewer({
  isOpen,
  target,
  original,
  modified,
}: SchemaJsonDiffViewerProps) {
  const editorRef = useRef<MonacoDiffEditor | null>(null);

  const layoutEditor = useCallback(() => {
    window.requestAnimationFrame(() => {
      editorRef.current?.layout();
      window.requestAnimationFrame(() => editorRef.current?.layout());
    });
  }, []);

  const handleMount = useCallback(
    (editor: MonacoDiffEditor) => {
      editorRef.current = editor;
      layoutEditor();
    },
    [layoutEditor]
  );

  useEffect(() => {
    if (isOpen) {
      layoutEditor();
    }
  }, [isOpen, layoutEditor]);

  return (
    <div className="flex h-full min-h-[420px] min-w-0 flex-col">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-base-300 bg-base-300">
        <DiffEditor
          height="100%"
          width="100%"
          language="json"
          original={original}
          modified={modified}
          originalModelPath={`${target}-original`}
          modifiedModelPath={`${target}-modified`}
          keepCurrentOriginalModel
          keepCurrentModifiedModel
          theme="vs-dark"
          loading={<div className="p-4 text-sm text-base-content/60">Loading editor...</div>}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            ignoreTrimWhitespace: false,
            minimap: { enabled: false },
            originalEditable: false,
            readOnly: true,
            renderSideBySide: false,
            scrollBeyondLastLine: false,
            compactMode: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
