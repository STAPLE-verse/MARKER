export const COLLECTION_TABS = ["owned", "archived"] as const;

export type CollectionTab = (typeof COLLECTION_TABS)[number];

export function isCollectionTab(value: string): value is CollectionTab {
  return (COLLECTION_TABS as readonly string[]).includes(value);
}

export function collectionTabHref(tab: CollectionTab): string {
  return tab === "owned" ? "/collection" : `/collection?tab=${tab}`;
}
