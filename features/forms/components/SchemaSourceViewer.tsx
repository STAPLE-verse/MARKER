"use client";

import Editor from "@monaco-editor/react";

interface SchemaSourceViewerProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

function ReadOnlyJson({ title, value, path }: { title: string; value: Record<string, unknown>; path: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col h-[500px]">
      <h4 className="text-base font-semibold text-base-content/90 uppercase tracking-wider mb-2">{title}</h4>
      <div className="bg-base-200 rounded-lg border border-base-300 flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          path={path}
          value={JSON.stringify(value, null, 2)}
          loading={<div className="p-4 text-base text-base-content/90">Loading…</div>}
          options={{
            readOnly: true,
            // Shown by the editor when someone tries to type into it.
            readOnlyMessage: { value: "This is a read-only view. Use Edit Schema to make changes." },
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Read-only side-by-side view of a form version's data schema and UI schema
 * JSON. Uses the same editor, headings and framing as Form Studio's JSON
 * Editor tab, so viewing a schema and editing it look like the same thing —
 * the only difference is that this one can't be typed into.
 */
export function SchemaSourceViewer({ schema, uiSchema }: SchemaSourceViewerProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      <ReadOnlyJson title="Data Schema" value={schema} path="view-schema.json" />
      <ReadOnlyJson title="UI Schema" value={uiSchema} path="view-ui-schema.json" />
    </div>
  );
}
