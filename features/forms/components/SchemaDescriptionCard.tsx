import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { extractSchemaDescription } from "@/utils/schema";

interface SchemaDescriptionCardProps {
  schema: Record<string, unknown>;
}

/**
 * Displays the human-readable description pulled from a JSON Schema's `description`
 * field. Falls back to a placeholder when none is present.
 */
export function SchemaDescriptionCard({ schema }: SchemaDescriptionCardProps) {
  const description = extractSchemaDescription(schema);

  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Description</CardTitle>
        <p className="text-base-content/85 leading-relaxed">
          {description || "No description provided."}
        </p>
      </CardBody>
    </Card>
  );
}
