import { requirePageAuth } from "@/utils/auth";
import { getUserArchivedForms, getUserForms } from "@/features/forms/queries";
import { getCollectionStatusBadgeLabel } from "@/features/forms/utils/versionLabel";
import type { FormWithLatestVersion } from "@/features/forms/types";
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
      updatedAt: new Date(f.updatedAt).toLocaleDateString(),
    };
  });
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const { userId } = await requirePageAuth();
  const { tab: tabParam } = await searchParams;
  const rawTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  if (rawTab !== undefined && !isCollectionTab(rawTab)) {
    redirect("/collection");
  }

  const tab = parseCollectionTab(tabParam);
  const rawForms =
    tab === "archived" ? await getUserArchivedForms(userId) : await getUserForms(userId);

  return <CollectionClient tab={tab} schemas={mapFormsToRows(rawForms)} />;
}
