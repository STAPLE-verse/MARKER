import { searchPublishedSchemas } from "@/features/forms/queries";
import { parseExploreFilters } from "@/features/forms/utils/exploreFilters";
import ExploreClient from "./ExploreClient";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [schemas, params] = await Promise.all([searchPublishedSchemas(), searchParams]);

  return <ExploreClient schemas={schemas} initialFilters={parseExploreFilters(params)} />;
}
