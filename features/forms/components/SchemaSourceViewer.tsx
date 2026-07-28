interface SchemaSourceViewerProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

/**
 * Read-only side-by-side view of a form version's data schema and UI schema JSON.
 * Reusable on owner detail pages and (later) the public schema detail page.
 */
export function SchemaSourceViewer({ schema, uiSchema }: SchemaSourceViewerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-base-content/70 ml-1">Data Schema</h3>
        <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200 h-[500px]">
          <pre className="text-sm font-mono text-secondary-content">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-base-content/70 ml-1">UI Schema</h3>
        <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200 h-[500px]">
          <pre className="text-sm font-mono text-secondary-content">
            {JSON.stringify(uiSchema, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
