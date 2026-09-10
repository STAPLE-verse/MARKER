import { describe, expect, it, vi, beforeEach } from "vitest"
import { hashImportedSnapshot } from "../../utils/importHash"

const findManyForm = vi.fn()
const findManyMarkerForm = vi.fn()

vi.mock("@/lib/db", () => ({
  prisma: {
    form: { findMany: (...args: unknown[]) => findManyForm(...args) },
    markerForm: { findMany: (...args: unknown[]) => findManyMarkerForm(...args) },
  },
}))

import { getStapleImportOptions } from "./getStapleImportOptions"

const USER_ID = 1
const SOURCE_FORM_ID = 10

const HEAD_SCHEMA = { type: "object", title: "Cognitive Assessment" }
const HEAD_UI_SCHEMA = {}

describe("getStapleImportOptions", () => {
  beforeEach(() => {
    findManyForm.mockReset()
    findManyMarkerForm.mockReset()
  })

  it("only queries the caller's own non-archived staple forms", async () => {
    findManyForm.mockResolvedValue([])
    findManyMarkerForm.mockResolvedValue([])

    await getStapleImportOptions(USER_ID)

    expect(findManyForm).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, app: "staple", archived: false },
      })
    )
  })

  it("never selects schema/uiSchema for the STAPLE version list", async () => {
    findManyForm.mockResolvedValue([])
    findManyMarkerForm.mockResolvedValue([])

    await getStapleImportOptions(USER_ID)

    const call = findManyForm.mock.calls[0][0]
    const versionSelect = call.select.versions.select
    expect(versionSelect).not.toHaveProperty("schema")
    expect(versionSelect).not.toHaveProperty("uiSchema")
  })

  it("does not query task/project relations anywhere", async () => {
    findManyForm.mockResolvedValue([])
    findManyMarkerForm.mockResolvedValue([])

    await getStapleImportOptions(USER_ID)

    const formCall = JSON.stringify(findManyForm.mock.calls[0][0])
    const markerCall = JSON.stringify(findManyMarkerForm.mock.calls[0][0])
    expect(formCall).not.toMatch(/task|project/i)
    expect(markerCall).not.toMatch(/task|project/i)
  })

  it("only includes the DTO fields — never the target's schema/uiSchema", async () => {
    findManyForm.mockResolvedValue([
      {
        id: SOURCE_FORM_ID,
        versions: [{ id: 100, version: 1, name: "Cognitive Assessment", createdAt: new Date("2026-09-01") }],
      },
    ])
    findManyMarkerForm.mockResolvedValue([
      {
        id: 42,
        importedFromStapleFormId: SOURCE_FORM_ID,
        importedFromStapleVersionNumber: 1,
        originalImportHash: hashImportedSnapshot(HEAD_SCHEMA, HEAD_UI_SCHEMA),
        versions: [{ name: "Cognitive Assessment", version: 1, schema: HEAD_SCHEMA, uiSchema: HEAD_UI_SCHEMA }],
      },
    ])

    const result = await getStapleImportOptions(USER_ID)

    expect(result[0].markerTargets[0]).toEqual({
      id: 42,
      latestName: "Cognitive Assessment",
      latestVersion: 1,
      importedSourceVersion: 1,
      modificationStatus: "UNMODIFIED",
    })
  })

  it("flips modificationStatus to MODIFIED once the target's head diverges from the import baseline", async () => {
    findManyForm.mockResolvedValue([
      { id: SOURCE_FORM_ID, versions: [{ id: 100, version: 1, name: "Form", createdAt: new Date("2026-09-01") }] },
    ])
    findManyMarkerForm.mockResolvedValue([
      {
        id: 42,
        importedFromStapleFormId: SOURCE_FORM_ID,
        importedFromStapleVersionNumber: 1,
        originalImportHash: hashImportedSnapshot(HEAD_SCHEMA, HEAD_UI_SCHEMA),
        versions: [
          { name: "Form", version: 1, schema: { ...HEAD_SCHEMA, title: "Edited locally" }, uiSchema: HEAD_UI_SCHEMA },
        ],
      },
    ])

    const result = await getStapleImportOptions(USER_ID)

    expect(result[0].markerTargets[0].modificationStatus).toBe("MODIFIED")
  })

  it("only associates markerTargets with the matching importedFromStapleFormId", async () => {
    findManyForm.mockResolvedValue([
      { id: SOURCE_FORM_ID, versions: [{ id: 100, version: 1, name: "Form A", createdAt: new Date() }] },
      { id: SOURCE_FORM_ID + 1, versions: [{ id: 101, version: 1, name: "Form B", createdAt: new Date() }] },
    ])
    findManyMarkerForm.mockResolvedValue([
      {
        id: 42,
        importedFromStapleFormId: SOURCE_FORM_ID,
        importedFromStapleVersionNumber: 1,
        originalImportHash: null,
        versions: [{ name: "Form A copy", version: 1, schema: {}, uiSchema: {} }],
      },
    ])

    const result = await getStapleImportOptions(USER_ID)

    const formA = result.find((form) => form.id === SOURCE_FORM_ID)!
    const formB = result.find((form) => form.id === SOURCE_FORM_ID + 1)!
    expect(formA.markerTargets).toHaveLength(1)
    expect(formB.markerTargets).toHaveLength(0)
  })

  it("excludes STAPLE forms with no active versions", async () => {
    findManyForm.mockResolvedValue([{ id: SOURCE_FORM_ID, versions: [] }])
    findManyMarkerForm.mockResolvedValue([])

    const result = await getStapleImportOptions(USER_ID)

    expect(result).toHaveLength(0)
  })
})
