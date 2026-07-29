import { SCHEMA_SOURCE_IDS } from "./sourceIds";
import type { AddSchemaMethod } from "./types";

export const ADD_SCHEMA_METHODS = [
  {
    id: "blank",
    title: "Blank draft",
    description: "Create a new native schema in MARKER and open the form builder.",
    href: "/collection/new/blank",
    availability: "available",
  },
  {
    id: SCHEMA_SOURCE_IDS.STAPLE,
    title: "From STAPLE",
    description: "Import a selected metadata form version from STAPLE.",
    href: "/collection/new/staple",
    availability: "coming-soon",
  },
  {
    id: SCHEMA_SOURCE_IDS.CEDAR,
    title: "From CEDAR",
    description: "Import and transform a schema from the CEDAR ecosystem.",
    href: "/collection/new/cedar",
    availability: "coming-soon",
  },
  {
    id: SCHEMA_SOURCE_IDS.DATACITE,
    title: "From DataCite",
    description: "Import a schema from the DataCite ecosystem.",
    href: "/collection/new/datacite",
    availability: "coming-soon",
  },
] as const satisfies readonly AddSchemaMethod[];
