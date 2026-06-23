import { requirePageAuth } from "@/utils/auth";
import { getUserForms } from "@/features/forms/queries";
import CollectionClient, { CollectionSchemaRow } from "./CollectionClient";

export default async function CollectionPage() {
  const { userId } = await requirePageAuth();

  const rawForms = await getUserForms(userId);

  // Transform raw FormWithLatestVersion[] into the flat array expected by DataTable
  const schemas: CollectionSchemaRow[] = rawForms.map((f) => ({
    id: f.id,
    title: f.versions[0]?.name || "Untitled Draft",
    type: "Draft", // Phase 1 is purely draft lifecycle
    version: f.versions[0]?.version || 1,
    updatedAt: new Date(f.updatedAt).toLocaleDateString(),
  }));

  return <CollectionClient schemas={schemas} />;
}
