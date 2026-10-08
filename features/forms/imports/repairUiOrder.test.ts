import { describe, expect, it } from "vitest"
import { repairUiOrder } from "./repairUiOrder"

describe("repairUiOrder", () => {
  it("drops blank ui:order entries, including nested ones", () => {
    const repaired = repairUiOrder({
      "ui:order": ["a", "", " ", "b"],
      section: { "ui:order": ["", "c"], c: { "ui:widget": "textarea" } },
    })
    expect(repaired).toEqual({
      "ui:order": ["a", "b"],
      section: { "ui:order": ["c"], c: { "ui:widget": "textarea" } },
    })
  })

  it("keeps wildcards and leaves null/primitive uiSchemas alone", () => {
    expect(repairUiOrder({ "ui:order": ["a", "*"] })).toEqual({ "ui:order": ["a", "*"] })
    expect(repairUiOrder(null)).toBeNull()
  })
})
