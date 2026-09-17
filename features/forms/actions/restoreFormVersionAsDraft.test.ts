import { describe, expect, it, vi, beforeEach } from "vitest"

const FORM_ID = 1
const OWNER_ID = 1
const SOURCE_VERSION_ID = 10
const LATEST_VERSION_ID = 30

const findUniqueMarkerForm = vi.fn()
const findUniqueMarkerFormVersion = vi.fn()
const createMarkerFormVersion = vi.fn()
const findUniquePublicationMetadata = vi.fn()
const queryRaw = vi.fn()

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormVersion: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormVersion(...args),
      create: (...args: unknown[]) => createMarkerFormVersion(...args),
    },
    publicationMetadata: {
      findUnique: (...args: unknown[]) => findUniquePublicationMetadata(...args),
    },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  }
  return { prisma: client }
})

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { restoreFormVersionAsDraft } from "./restoreFormVersionAsDraft"

describe("restoreFormVersionAsDraft STAPLE provenance", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset()
    findUniqueMarkerFormVersion.mockReset()
    createMarkerFormVersion.mockReset()
    findUniquePublicationMetadata.mockReset()
    findUniquePublicationMetadata.mockResolvedValue(null)
    queryRaw.mockReset()

    // Current head (v3) traces to a *later* STAPLE import than the version
    // being restored (v1) — the two must not be conflated.
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      versions: [
        {
          id: LATEST_VERSION_ID,
          version: 3,
          importedFromStapleVersionNumber: 5,
          importedAt: new Date("2026-09-04T00:00:00.000Z"),
          originalImportHash: "sha256:head-hash",
        },
      ],
    })
    createMarkerFormVersion.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 99,
      ...data,
    }))
    queryRaw.mockResolvedValue([])
  })

  it("copies the restored version's own provenance, not the current head's", async () => {
    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      formId: FORM_ID,
      archived: false,
      status: "DRAFT",
      name: "v1",
      schema: {},
      uiSchema: {},
      semantics: null,
      importedFromStapleVersionNumber: 3,
      importedAt: new Date("2026-08-01T00:00:00.000Z"),
      originalImportHash: "sha256:source-hash",
      isDirectStapleImport: true,
      publicationMetadata: null,
    })

    await restoreFormVersionAsDraft({ formId: FORM_ID, versionId: SOURCE_VERSION_ID })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.importedFromStapleVersionNumber).toBe(3)
    expect(data.importedAt).toEqual(new Date("2026-08-01T00:00:00.000Z"))
    expect(data.originalImportHash).toBe("sha256:source-hash")
  })

  it("never marks a restored draft as the direct import, even when the restored version was one", async () => {
    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      formId: FORM_ID,
      archived: false,
      status: "DRAFT",
      name: "v1",
      schema: {},
      uiSchema: {},
      semantics: null,
      importedFromStapleVersionNumber: 3,
      importedAt: new Date("2026-08-01T00:00:00.000Z"),
      originalImportHash: "sha256:source-hash",
      isDirectStapleImport: true,
      publicationMetadata: null,
    })

    await restoreFormVersionAsDraft({ formId: FORM_ID, versionId: SOURCE_VERSION_ID })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.isDirectStapleImport).toBe(false)
  })

  it("restores null provenance for a version that predates any STAPLE lineage", async () => {
    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      formId: FORM_ID,
      archived: false,
      status: "DRAFT",
      name: "v1",
      schema: {},
      uiSchema: {},
      semantics: null,
      importedFromStapleVersionNumber: null,
      importedAt: null,
      originalImportHash: null,
      publicationMetadata: null,
    })

    await restoreFormVersionAsDraft({ formId: FORM_ID, versionId: SOURCE_VERSION_ID })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.importedFromStapleVersionNumber).toBeNull()
    expect(data.importedAt).toBeNull()
    expect(data.originalImportHash).toBeNull()
  })

  it("carries forward the current head's publication metadata, not the restored version's own", async () => {
    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      formId: FORM_ID,
      archived: false,
      status: "DRAFT",
      name: "v1",
      schema: {},
      uiSchema: {},
      semantics: null,
      importedFromStapleVersionNumber: null,
      importedAt: null,
      originalImportHash: null,
      // The version being restored had no metadata of its own (or different
      // metadata) — this must not end up on the restored draft.
      publicationMetadata: null,
    })
    findUniquePublicationMetadata.mockResolvedValue({
      domain: "Neuroscience",
      language: "en",
      license: "CC-BY-4.0",
      keywords: ["eeg"],
      contributors: [{ name: "Head Author", roles: ["Author"] }],
    })

    await restoreFormVersionAsDraft({ formId: FORM_ID, versionId: SOURCE_VERSION_ID })

    expect(findUniquePublicationMetadata).toHaveBeenCalledWith({
      where: { formVersionId: LATEST_VERSION_ID },
    })
    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.publicationMetadata.create.domain).toBe("Neuroscience")
    expect(data.publicationMetadata.create.contributors).toEqual([
      expect.objectContaining({ name: "Head Author", roles: ["Author"] }),
    ])
  })

  it("falls back to default publication metadata when the head has none either", async () => {
    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      formId: FORM_ID,
      archived: false,
      status: "DRAFT",
      name: "v1",
      schema: {},
      uiSchema: {},
      semantics: null,
      importedFromStapleVersionNumber: null,
      importedAt: null,
      originalImportHash: null,
      publicationMetadata: null,
    })
    findUniquePublicationMetadata.mockResolvedValue(null)

    await restoreFormVersionAsDraft({ formId: FORM_ID, versionId: SOURCE_VERSION_ID })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.publicationMetadata.create.contributors).toEqual([])
  })
})
