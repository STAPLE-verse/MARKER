import { describe, expect, it, vi, beforeEach } from "vitest"

const resolveStapleSourceMock = vi.fn()

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: 1, session: {} })),
}))

vi.mock("../resolveStapleSource", () => ({
  resolveStapleSource: (...args: unknown[]) => resolveStapleSourceMock(...args),
}))

import { getStapleVersionPreview } from "./getStapleVersionPreview"

describe("getStapleVersionPreview", () => {
  beforeEach(() => {
    resolveStapleSourceMock.mockReset()
  })

  it("returns only schema/uiSchema — never semantics or provenance fields", async () => {
    resolveStapleSourceMock.mockResolvedValue({
      sourceFormId: 10,
      sourceVersionId: 100,
      sourceVersionNumber: 3,
      title: "Cognitive Assessment",
      schema: { type: "object" },
      uiSchema: { "ui:order": ["a"] },
      semantics: { root: { classIri: "https://schema.org/Thing" } },
    })

    const result = await getStapleVersionPreview({ sourceFormId: 10, sourceVersionId: 100 })

    expect(result).toEqual({
      ok: true,
      data: { schema: { type: "object" }, uiSchema: { "ui:order": ["a"] } },
    })
  })

  it("reuses resolveStapleSource's own authorization — a rejection surfaces as a failed ActionResult", async () => {
    const { ActionError } = await import("@/utils/action-result")
    resolveStapleSourceMock.mockRejectedValue(new ActionError("FORBIDDEN", "You do not have permission to import this form."))

    const result = await getStapleVersionPreview({ sourceFormId: 10, sourceVersionId: 100 })

    expect(result).toEqual({
      ok: false,
      code: "FORBIDDEN",
      error: "You do not have permission to import this form.",
    })
  })

  it("defaults uiSchema to {} when the source has none", async () => {
    resolveStapleSourceMock.mockResolvedValue({
      sourceFormId: 10,
      sourceVersionId: 100,
      sourceVersionNumber: 1,
      title: "Untitled",
      schema: { type: "object" },
      uiSchema: null,
      semantics: null,
    })

    const result = await getStapleVersionPreview({ sourceFormId: 10, sourceVersionId: 100 })

    expect(result).toEqual({ ok: true, data: { schema: { type: "object" }, uiSchema: {} } })
  })
})
