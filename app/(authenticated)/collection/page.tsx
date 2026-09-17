import { requirePageAuth } from "@/utils/auth";
import { getUserArchivedForms, getUserForms, getUserPublishedSchemas, getSharedWithMeForms } from "@/features/forms/queries";
import { getCollectionStatusBadgeLabel } from "@/features/forms/utils/versionLabel";
import type { FormWithLatestVersion, UserPublishedSchemaDTO } from "@/features/forms/types";
import { redirect } from "next/navigation";
import CollectionClient, { CollectionSchemaRow } from "./CollectionClient";
import {
  CollectionTab,
  isCollectionTab,
} from "./collectionTabs";

interface CollectionPageProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

function parseCollectionTab(raw: string | string[] | undefined): CollectionTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && isCollectionTab(value)) {
    return value;
  }
  return "owned";
}

function mapFormsToRows(forms: FormWithLatestVersion[]): CollectionSchemaRow[] {
  return forms.map((f) => {
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
      date: new Date(f.updatedAt).toLocaleDateString(),
      href: `/collection/${f.id}`,
    };
  });
}

/** `/schemas/[pid]` is the public catalog page — outside `/collection`'s own owner-authorized routes. */
function mapPublishedSchemasToRows(schemas: UserPublishedSchemaDTO[]): CollectionSchemaRow[] {
  return schemas.map((s, index) => ({
    id: index,
    title: s.title,
    status: "Published",
    statusLabel: `Published v${s.version}`,
    date: new Date(s.createdAt).toLocaleDateString(),
    href: `/schemas/${s.pid}`,
  }));
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const { userId } = await requirePageAuth();
  const { tab: tabParam } = await searchParams;
  const rawTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  if (rawTab !== undefined && !isCollectionTab(rawTab)) {
    redirect("/collection");
  }

  const tab = parseCollectionTab(tabParam);

  if (tab === "published") {
    const schemas = await getUserPublishedSchemas(userId);
    return <CollectionClient tab={tab} schemas={mapPublishedSchemasToRows(schemas)} />;
  }

  const rawForms =
    tab === "archived"
      ? await getUserArchivedForms(userId)
      : tab === "shared"
        ? await getSharedWithMeForms(userId)
        : await getUserForms(userId);

  return <CollectionClient tab={tab} schemas={mapFormsToRows(rawForms)} />;
}
