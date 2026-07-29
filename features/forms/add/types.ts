import type { AddSchemaMethodId } from "./sourceIds";

export interface AddSchemaMethod {
  id: AddSchemaMethodId;
  title: string;
  description: string;
  href: string;
  availability: "available" | "coming-soon";
}
