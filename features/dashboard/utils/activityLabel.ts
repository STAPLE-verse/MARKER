import { ActivityItemDTO } from "../types"

const ACTION_LABELS: Record<ActivityItemDTO["type"], string> = {
  CREATED: "Created draft",
  IMPORTED_STAPLE: "Imported from STAPLE",
  FORKED: "Forked schema",
  PUBLISHED: "Published schema",
}

export function getActivityActionLabel(item: ActivityItemDTO): string {
  return ACTION_LABELS[item.type]
}

export function getActivityTargetLabel(item: ActivityItemDTO): string {
  return item.version ? `${item.title} v${item.version}` : item.title
}
