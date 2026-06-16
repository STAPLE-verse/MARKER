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
