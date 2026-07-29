export const SCHEMA_SOURCE_IDS = {
  MARKER: "marker",
  STAPLE: "staple",
  CEDAR: "cedar",
  DATACITE: "datacite",
} as const;

export type SchemaSourceId =
  (typeof SCHEMA_SOURCE_IDS)[keyof typeof SCHEMA_SOURCE_IDS];

export const MARKER_IMPORT_SOURCE_IDS = [
  SCHEMA_SOURCE_IDS.STAPLE,
  SCHEMA_SOURCE_IDS.CEDAR,
  SCHEMA_SOURCE_IDS.DATACITE,
] as const;

export type MarkerImportSourceId =
  (typeof MARKER_IMPORT_SOURCE_IDS)[number];

export type ExternalImportSourceId = Exclude<
  MarkerImportSourceId,
  typeof SCHEMA_SOURCE_IDS.STAPLE
>;

export type AddSchemaMethodId = "blank" | MarkerImportSourceId;
