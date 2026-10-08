/**
 * STAPLE's form builder used to be able to write a blank key into `ui:order`
 * (a card whose key was cleared). A blank entry names no field, so it carries
 * no layout information and is always safe to drop. Anything else that is
 * wrong with a uiSchema is left alone for conformance validation to report.
 */
export function repairUiOrder<T>(uiSchema: T): T {
  if (Array.isArray(uiSchema)) return uiSchema.map(repairUiOrder) as T
  if (uiSchema === null || typeof uiSchema !== "object") return uiSchema

  const repaired: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(uiSchema)) {
    repaired[key] =
      key === "ui:order" && Array.isArray(value)
        ? value.filter((name) => !(typeof name === "string" && name.trim() === ""))
        : repairUiOrder(value)
  }
  return repaired as T
}
