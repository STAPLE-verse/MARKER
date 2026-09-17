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
    availability: "available",
  },
] as const satisfies readonly AddSchemaMethod[];
