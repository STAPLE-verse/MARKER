import { describe, expect, it, vi, beforeEach } from "vitest"
import { hashImportedSnapshot } from "../../utils/importHash"

const OWNER_ID = 1
const MARKER_FORM_ID = 42
const SOURCE_FORM_ID = 10

const HEAD_SCHEMA = { type: "object", title: "Cognitive Assessment" }
const HEAD_UI_SCHEMA = {}

const findFirstMarkerForm = vi.fn()
const findFirstForm = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findFirst: (...args: unknown[]) => findFirstMarkerForm(...args) },
    form: { findFirst: (...args: unknown[]) => findFirstForm(...args) },
  },
}))

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}))

import { getStapleSourceForUpdate } from "./getStapleSourceForUpdate"

describe("getStapleSourceForUpdate", () => {
  beforeEach(() => {
    findFirstMarkerForm.mockReset()
    findFirstForm.mockReset()
  })

  it("returns null when the form was never imported from STAPLE", async () => {
    findFirstMarkerForm.mockResolvedValue(null)

    const result = await getStapleSourceForUpdate({ formId: MARKER_FORM_ID })

    expect(result).toEqual({ ok: true, data: null })
    expect(findFirstForm).not.toHaveBeenCalled()
  })

  it("returns null when the STAPLE source form is no longer available", async () => {
    findFirstMarkerForm.mockResolvedValue({
      id: MARKER_FORM_ID,
      importedFromStapleFormId: SOURCE_FORM_ID,
      importedFromStapleVersionNumber: 3,
      originalImportHash: hashImportedSnapshot(HEAD_SCHEMA, HEAD_UI_SCHEMA),
      versions: [{ name: "Cognitive Assessment", version: 1, schema: HEAD_SCHEMA, uiSchema: HEAD_UI_SCHEMA }],
    })
    findFirstForm.mockResolvedValue(null)

    const result = await getStapleSourceForUpdate({ formId: MARKER_FORM_ID })

    expect(result).toEqual({ ok: true, data: null })
  })

  it("returns a scoped DTO with markerTargets containing only this one form", async () => {
    findFirstMarkerForm.mockResolvedValue({
      id: MARKER_FORM_ID,
      importedFromStapleFormId: SOURCE_FORM_ID,
      importedFromStapleVersionNumber: 3,
      originalImportHash: hashImportedSnapshot(HEAD_SCHEMA, HEAD_UI_SCHEMA),
      versions: [{ name: "Cognitive Assessment", version: 1, schema: HEAD_SCHEMA, uiSchema: HEAD_UI_SCHEMA }],
    })
    findFirstForm.mockResolvedValue({
      id: SOURCE_FORM_ID,
      versions: [
        { id: 200, version: 4, name: "Cognitive Assessment", createdAt: new Date("2026-09-05") },
        { id: 100, version: 3, name: "Cognitive Assessment", createdAt: new Date("2026-09-01") },
      ],
    })

    const result = await getStapleSourceForUpdate({ formId: MARKER_FORM_ID })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).not.toBeNull()
    expect(result.data!.id).toBe(SOURCE_FORM_ID)
    expect(result.data!.versions).toHaveLength(2)
    expect(result.data!.markerTargets).toHaveLength(1)
    expect(result.data!.markerTargets[0]).toEqual({
      id: MARKER_FORM_ID,
      latestName: "Cognitive Assessment",
      latestVersion: 1,
      importedSourceVersion: 3,
      modificationStatus: "UNMODIFIED",
    })
  })

  it("reports MODIFIED when the current head diverges from the import baseline", async () => {
    findFirstMarkerForm.mockResolvedValue({
      id: MARKER_FORM_ID,
      importedFromStapleFormId: SOURCE_FORM_ID,
      importedFromStapleVersionNumber: 3,
      originalImportHash: hashImportedSnapshot(HEAD_SCHEMA, HEAD_UI_SCHEMA),
      versions: [
        { name: "Cognitive Assessment", version: 1, schema: { ...HEAD_SCHEMA, title: "Edited" }, uiSchema: HEAD_UI_SCHEMA },
      ],
    })
    findFirstForm.mockResolvedValue({
      id: SOURCE_FORM_ID,
      versions: [{ id: 100, version: 3, name: "Cognitive Assessment", createdAt: new Date("2026-09-01") }],
    })

    const result = await getStapleSourceForUpdate({ formId: MARKER_FORM_ID })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data!.markerTargets[0].modificationStatus).toBe("MODIFIED")
  })

  it("scopes both queries to the authenticated user (ownership never trusted from elsewhere)", async () => {
    findFirstMarkerForm.mockResolvedValue({
      id: MARKER_FORM_ID,
      importedFromStapleFormId: SOURCE_FORM_ID,
      importedFromStapleVersionNumber: 1,
      originalImportHash: null,
      versions: [{ name: "Form", version: 1, schema: {}, uiSchema: {} }],
    })
    findFirstForm.mockResolvedValue({
      id: SOURCE_FORM_ID,
      versions: [{ id: 100, version: 1, name: "Form", createdAt: new Date() }],
    })

    await getStapleSourceForUpdate({ formId: MARKER_FORM_ID })

    expect(findFirstMarkerForm.mock.calls[0][0].where).toMatchObject({
      id: MARKER_FORM_ID,
      ownerId: OWNER_ID,
      origin: "IMPORTED_STAPLE",
    })
    expect(findFirstForm.mock.calls[0][0].where).toMatchObject({
      id: SOURCE_FORM_ID,
      userId: OWNER_ID,
      app: "staple",
      archived: false,
    })
  })
})
