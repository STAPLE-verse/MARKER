import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
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
    <CollapsibleCard
      bordered
      defaultOpen
      title={
        <h2 className="w-full text-xl font-bold border-b border-base-200 pb-2">
          Description
        </h2>
      }
      titleClassName="px-8 pt-8 pb-4"
      contentClassName="px-8 pt-0 pb-8"
    >
      <p className="text-base-content/85 leading-relaxed">
        {description || "No description provided."}
      </p>
    </CollapsibleCard>
  );
}
