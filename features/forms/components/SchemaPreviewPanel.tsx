import { FormStudioProvider, FormPreview } from "@staple-verse/form-studio";

interface SchemaPreviewPanelProps {
  schema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

/**
 * Renders a live, read-only preview of a schema using Form Studio's public API.
 * MARKER consumes Form Studio here (one-way dependency); the panel
 * itself stays presentational.
 */
export function SchemaPreviewPanel({ schema, uiSchema }: SchemaPreviewPanelProps) {
  return (
    <div className="border border-base-200 rounded-lg p-6 bg-base-50">
      <FormStudioProvider initialSchema={schema} initialUiSchema={uiSchema}>
        <FormPreview />
      </FormStudioProvider>
    </div>
  );
}
