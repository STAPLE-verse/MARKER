import { describe, expect, it, vi, beforeEach } from "vitest"
import { hashImportedSnapshot } from "../../utils/importHash"

const OWNER_ID = 1
const SOURCE_FORM_ID = 10
const SOURCE_VERSION_ID = 100
const TARGET_FORM_ID = 42

const VALID_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: { title: { type: "string" } },
}
// Mismatched $schema dialect — a genuine Core V1 FORM_SCHEMA_DIALECT failure
// (same fixture as features/forms/utils/templatePackage.test.ts).
const INVALID_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {},
}

function stapleVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: SOURCE_VERSION_ID,
    formId: SOURCE_FORM_ID,
    version: 4,
    name: "Cognitive Assessment",
    schema: VALID_SCHEMA,
    uiSchema: {},
    semantics: null,
    archived: false,
    form: { id: SOURCE_FORM_ID, userId: OWNER_ID, archived: false, app: "staple" },
    ...overrides,
  }
}

function targetForm(overrides: Record<string, unknown> = {}) {
  const versions = (overrides.versions as unknown[] | undefined) ?? [
    {
      id: 900,
      formId: TARGET_FORM_ID,
      version: 2,
      name: "Cognitive Assessment",
      schema: VALID_SCHEMA,
      uiSchema: {},
      semantics: null,
    },
  ]
  return {
    id: TARGET_FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    familyId: "mf_target1234",
    origin: "IMPORTED_STAPLE",
    importedFromStapleFormId: SOURCE_FORM_ID,
    originalImportHash: hashImportedSnapshot(VALID_SCHEMA, {}),
    ...overrides,
    versions,
  }
}

const findUniqueFormVersion = vi.fn()
const findUniqueUser = vi.fn()
const findUniqueMarkerForm = vi.fn()
const createMarkerForm = vi.fn()
const updateMarkerForm = vi.fn()
const findUniquePublicationMetadata = vi.fn()
const createMarkerFormVersion = vi.fn()
const queryRaw = vi.fn()

vi.mock("@/lib/db", () => {
  const client = {
    formVersion: { findUnique: (...args: unknown[]) => findUniqueFormVersion(...args) },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    markerForm: {
      findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args),
      create: (...args: unknown[]) => createMarkerForm(...args),
      update: (...args: unknown[]) => updateMarkerForm(...args),
    },
    publicationMetadata: { findUnique: (...args: unknown[]) => findUniquePublicationMetadata(...args) },
    markerFormVersion: { create: (...args: unknown[]) => createMarkerFormVersion(...args) },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  }
  return { prisma: client }
})

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}))

// revalidatePath requires a real Next.js request/rendering context that
// doesn't exist when calling a "use server" action directly in a unit test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { importFromStaple } from "./importFromStaple"

describe("importFromStaple", () => {
  beforeEach(() => {
    findUniqueFormVersion.mockReset()
    findUniqueUser.mockReset()
    findUniqueMarkerForm.mockReset()
    createMarkerForm.mockReset()
    updateMarkerForm.mockReset()
    findUniquePublicationMetadata.mockReset()
    createMarkerFormVersion.mockReset()
    queryRaw.mockReset()

    findUniqueFormVersion.mockResolvedValue(stapleVersion())
    findUniqueUser.mockResolvedValue({ firstName: "Jane", lastName: "Doe", orcid: null })
    findUniqueMarkerForm.mockResolvedValue(targetForm())
    createMarkerForm.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 55, ...data }))
    updateMarkerForm.mockResolvedValue({})
    findUniquePublicationMetadata.mockResolvedValue(null)
    createMarkerFormVersion.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 999, ...data }))
    queryRaw.mockResolvedValue([])
  })

  describe("create mode", () => {
    it("persists correct provenance fields on the new MarkerForm", async () => {
      const result = await importFromStaple({
        mode: "create",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
      })

      expect(result.ok).toBe(true)
      const data = createMarkerForm.mock.calls[0][0].data
      expect(data.ownerId).toBe(OWNER_ID)
      expect(data.origin).toBe("IMPORTED_STAPLE")
      expect(data.importedFromStapleFormId).toBe(SOURCE_FORM_ID)
      expect(data.importedFromStapleVersionNumber).toBe(4)
      expect(data.originalImportHash).toMatch(/^sha256:[0-9a-f]{64}$/)
      expect(data.versions.create.version).toBe(1)
      expect(data.versions.create.schema).toEqual(VALID_SCHEMA)
    })

    it("also stamps the version-level provenance fields, matching the form-level ones exactly", async () => {
      await importFromStaple({ mode: "create", sourceFormId: SOURCE_FORM_ID, sourceVersionId: SOURCE_VERSION_ID })

      const data = createMarkerForm.mock.calls[0][0].data
      expect(data.versions.create.importedFromStapleVersionNumber).toBe(4)
      expect(data.versions.create.importedAt).toEqual(data.importedAt)
      expect(data.versions.create.originalImportHash).toBe(data.originalImportHash)
    })

    it("seeds fresh publication metadata with the importing user credited as Creator", async () => {
      await importFromStaple({ mode: "create", sourceFormId: SOURCE_FORM_ID, sourceVersionId: SOURCE_VERSION_ID })

      const data = createMarkerForm.mock.calls[0][0].data
      const contributors = data.versions.create.publicationMetadata.create.contributors as Array<{
        name: string
        roles: string[]
      }>
      expect(contributors).toContainEqual(
        expect.objectContaining({ name: "Jane Doe", roles: expect.arrayContaining(["Creator"]) })
      )
    })

    it("rejects with VALIDATION when the STAPLE schema fails Core V1, and persists nothing", async () => {
      findUniqueFormVersion.mockResolvedValue(stapleVersion({ schema: INVALID_SCHEMA }))

      const result = await importFromStaple({
        mode: "create",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("VALIDATION")
      expect(createMarkerForm).not.toHaveBeenCalled()
    })

    it("rejects with VALIDATION when STAPLE's semantics fail Semantic V1, and persists nothing", async () => {
      findUniqueFormVersion.mockResolvedValue(
        stapleVersion({ schema: { type: "object" }, semantics: { bindings: "not-an-array" } })
      )

      const result = await importFromStaple({
        mode: "create",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("VALIDATION")
      expect(createMarkerForm).not.toHaveBeenCalled()
    })
  })

  describe("update mode", () => {
    it("appends latest.version + 1 and refreshes the MarkerForm's import provenance", async () => {
      findUniqueFormVersion.mockResolvedValue(stapleVersion({ version: 5 }))

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(true)
      const versionData = createMarkerFormVersion.mock.calls[0][0].data
      expect(versionData.formId).toBe(TARGET_FORM_ID)
      expect(versionData.version).toBe(3)

      const updateData = updateMarkerForm.mock.calls[0][0].data
      expect(updateData.importedFromStapleVersionNumber).toBe(5)
      expect(updateData.originalImportHash).toMatch(/^sha256:[0-9a-f]{64}$/)

      // Version-level fields stamp fresh (this version IS the import
      // event) — never copied forward from the previous head.
      expect(versionData.importedFromStapleVersionNumber).toBe(5)
      expect(versionData.importedAt).toEqual(updateData.importedAt)
      expect(versionData.originalImportHash).toBe(updateData.originalImportHash)
    })

    it("preserves the target's existing publication metadata rather than resetting to defaults", async () => {
      findUniquePublicationMetadata.mockResolvedValue({
        domain: "Psychology",
        language: "en",
        license: "CC-BY-4.0",
        keywords: ["assessment"],
        contributors: [{ name: "Existing Curator", roles: ["Creator"] }],
      })

      await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      const versionData = createMarkerFormVersion.mock.calls[0][0].data
      expect(versionData.publicationMetadata.create.domain).toBe("Psychology")
      expect(versionData.publicationMetadata.create.contributors).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Existing Curator" })])
      )
    })

    it("rejects with CONFLICT when the target's importedFromStapleFormId doesn't match the selected source", async () => {
      findUniqueMarkerForm.mockResolvedValue(targetForm({ importedFromStapleFormId: SOURCE_FORM_ID + 1 }))

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("CONFLICT")
      expect(createMarkerFormVersion).not.toHaveBeenCalled()
    })

    it("rejects with CONFLICT when the target form's origin is not IMPORTED_STAPLE", async () => {
      findUniqueMarkerForm.mockResolvedValue(targetForm({ origin: "NATIVE" }))

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("CONFLICT")
      expect(createMarkerFormVersion).not.toHaveBeenCalled()
    })

    it("succeeds without confirmOverwrite when the target is unmodified since its last import", async () => {
      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(true)
    })

    it("rejects with CONFLICT when the target has local edits and confirmOverwrite is not set, and persists nothing", async () => {
      findUniqueMarkerForm.mockResolvedValue(
        targetForm({
          versions: [
            {
              id: 900,
              formId: TARGET_FORM_ID,
              version: 2,
              name: "Cognitive Assessment",
              schema: { ...VALID_SCHEMA, title: "Edited locally" },
              uiSchema: {},
              semantics: null,
            },
          ],
        })
      )

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("CONFLICT")
      expect(createMarkerFormVersion).not.toHaveBeenCalled()
    })

    it("succeeds when the target has local edits and confirmOverwrite is true", async () => {
      findUniqueMarkerForm.mockResolvedValue(
        targetForm({
          versions: [
            {
              id: 900,
              formId: TARGET_FORM_ID,
              version: 2,
              name: "Cognitive Assessment",
              schema: { ...VALID_SCHEMA, title: "Edited locally" },
              uiSchema: {},
              semantics: null,
            },
          ],
        })
      )

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
        confirmOverwrite: true,
      })

      expect(result.ok).toBe(true)
      expect(createMarkerFormVersion).toHaveBeenCalledTimes(1)
    })

    it("uses the freshly-locked head for the modification check, not a stale value", async () => {
      // Even though the mock always returns the same head regardless of when
      // it's called, this asserts the check happens against whatever
      // getAuthorizedLatestVersion returns inside the lock — i.e. it reads
      // `form`/`latestVersion` from the callback, never a value captured
      // before `withLockedAuthorizedLatestVersion` was entered.
      findUniqueMarkerForm.mockResolvedValue(targetForm())

      const result = await importFromStaple({
        mode: "update",
        sourceFormId: SOURCE_FORM_ID,
        sourceVersionId: SOURCE_VERSION_ID,
        targetMarkerFormId: TARGET_FORM_ID,
      })

      expect(result.ok).toBe(true)
      // getAuthorizedLatestVersion is called once before the lock (fast-fail
      // authorization) and once inside it (re-check after locking).
      expect(findUniqueMarkerForm).toHaveBeenCalledTimes(2)
    })
  })
})
