import { requirePageAuth } from "@/utils/auth";
import { getUserForms } from "@/features/forms/queries";
import { getCollectionStatusBadgeLabel } from "@/features/forms/utils/versionLabel";
import CollectionClient, { CollectionSchemaRow } from "./CollectionClient";

export default async function CollectionPage() {
  const { userId } = await requirePageAuth();

  const rawForms = await getUserForms(userId);

  const schemas: CollectionSchemaRow[] = rawForms.map((f) => {
    const latestVersion = f.versions[0];
    const status = latestVersion?.status ?? "DRAFT";
    return {
      id: f.id,
      title: latestVersion?.name || "Untitled Draft",
      status: status === "PUBLISHED" ? "Published" : "Draft",
      statusLabel: getCollectionStatusBadgeLabel(
        status,
        latestVersion?.version ?? 1,
        latestVersion?.publishedSchemas[0]?.version
      ),
      updatedAt: new Date(f.updatedAt).toLocaleDateString(),
    };
  });

  return <CollectionClient schemas={schemas} />;
}
