import { describe, expect, it, vi, beforeEach } from "vitest"

const findUniqueFormVersion = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    formVersion: { findUnique: (...args: unknown[]) => findUniqueFormVersion(...args) },
  },
}))

import { resolveStapleSource } from "./resolveStapleSource"

const OWNER_ID = 1
const OTHER_USER_ID = 2
const SOURCE_FORM_ID = 10
const SOURCE_VERSION_ID = 100

const VALID_VERSION = {
  id: SOURCE_VERSION_ID,
  formId: SOURCE_FORM_ID,
  version: 3,
  name: "Cognitive Assessment",
  schema: { type: "object", properties: {} },
  uiSchema: {},
  semantics: null,
  archived: false,
  form: { id: SOURCE_FORM_ID, userId: OWNER_ID, archived: false, app: "staple" },
}

describe("resolveStapleSource", () => {
  beforeEach(() => {
    findUniqueFormVersion.mockReset()
  })

  it("returns the resolved snapshot for an owned, active STAPLE version", async () => {
    findUniqueFormVersion.mockResolvedValue(VALID_VERSION)

    const result = await resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)

    expect(result).toEqual({
      sourceFormId: SOURCE_FORM_ID,
      sourceVersionId: SOURCE_VERSION_ID,
      sourceVersionNumber: 3,
      title: "Cognitive Assessment",
      schema: VALID_VERSION.schema,
      uiSchema: VALID_VERSION.uiSchema,
      semantics: null,
    })
  })

  it("rejects a version owned by another user with FORBIDDEN", async () => {
    findUniqueFormVersion.mockResolvedValue({
      ...VALID_VERSION,
      form: { ...VALID_VERSION.form, userId: OTHER_USER_ID },
    })

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
  })

  it("rejects a missing version with NOT_FOUND", async () => {
    findUniqueFormVersion.mockResolvedValue(null)

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("rejects a version/form id mismatch with NOT_FOUND", async () => {
    findUniqueFormVersion.mockResolvedValue({ ...VALID_VERSION, formId: SOURCE_FORM_ID + 1 })

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("rejects an archived version with NOT_FOUND", async () => {
    findUniqueFormVersion.mockResolvedValue({ ...VALID_VERSION, archived: true })

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("rejects an archived parent form with NOT_FOUND", async () => {
    findUniqueFormVersion.mockResolvedValue({
      ...VALID_VERSION,
      form: { ...VALID_VERSION.form, archived: true },
    })

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("rejects a non-staple app form with NOT_FOUND", async () => {
    findUniqueFormVersion.mockResolvedValue({
      ...VALID_VERSION,
      form: { ...VALID_VERSION.form, app: "marker" },
    })

    await expect(resolveStapleSource(SOURCE_FORM_ID, SOURCE_VERSION_ID, OWNER_ID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
