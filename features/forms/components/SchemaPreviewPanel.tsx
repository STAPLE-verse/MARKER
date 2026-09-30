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
    // No frame of its own: the builder's Live Preview tab shows the form
    // directly on the panel, and this should look the same.
    <FormStudioProvider initialSchema={schema} initialUiSchema={uiSchema}>
      <FormPreview />
    </FormStudioProvider>
  );
}
