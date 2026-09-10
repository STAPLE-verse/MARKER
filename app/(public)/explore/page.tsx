import { searchPublishedSchemas } from "@/features/forms/queries";
import ExploreClient from "./ExploreClient";

export default async function ExplorePage() {
  const schemas = await searchPublishedSchemas();

  return <ExploreClient schemas={schemas} />;
}
