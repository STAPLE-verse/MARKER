export function extractSchemaTitle(schema: unknown, defaultTitle: string = "Untitled Draft"): string {
  if (typeof schema !== "object" || schema === null) {
    return defaultTitle;
  }

  const schemaObj = schema as Record<string, unknown>;
  
  if (typeof schemaObj.title === "string" && schemaObj.title.trim() !== "") {
    return schemaObj.title;
  }
  
  return defaultTitle;
}

export function extractSchemaDescription(schema: unknown): string {
  if (typeof schema !== "object" || schema === null) {
    return "";
  }

  const schemaObj = schema as Record<string, unknown>;

  if (typeof schemaObj.description === "string") {
    return schemaObj.description;
  }

  return "";
}

/**
 * Recursively walks a JSON Schema object and collects every `ontologyId` string
 * value it encounters (e.g., "SNOMED:75367002"). Used at publish time to populate
 * PublishedSchema.ontologyRefs for semantic search.
 */
export function extractOntologyIds(schema: unknown): string[] {
  const ids = new Set<string>();

  function traverse(obj: unknown) {
    if (typeof obj !== "object" || obj === null) return;

    const record = obj as Record<string, unknown>;
    if (typeof record.ontologyId === "string") {
      ids.add(record.ontologyId);
    }

    Object.values(record).forEach(traverse);
  }

  traverse(schema);
  return Array.from(ids);
}
