import { describe, expect, it, vi, beforeEach } from "vitest"

const FORM_ID = 1
const VERSION_ID = 10
const OWNER_ID = 1
const UPDATED_AT = new Date("2026-09-01T00:00:00.000Z")

const findUniqueMarkerForm = vi.fn()
const createMarkerFormVersion = vi.fn()
const queryRaw = vi.fn()

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormVersion: { create: (...args: unknown[]) => createMarkerFormVersion(...args) },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  }
  return { prisma: client }
})

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { createFormCheckpoint } from "./createFormCheckpoint"

describe("createFormCheckpoint STAPLE provenance carry-forward", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset()
    createMarkerFormVersion.mockReset()
    queryRaw.mockReset()

    createMarkerFormVersion.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 99,
      ...data,
    }))
    queryRaw.mockResolvedValue([])
  })

  it("carries the current head's STAPLE provenance forward unchanged", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      versions: [
        {
          id: VERSION_ID,
          version: 3,
          status: "DRAFT",
          updatedAt: UPDATED_AT,
          importedFromStapleVersionNumber: 5,
          importedAt: new Date("2026-08-01T00:00:00.000Z"),
          originalImportHash: "sha256:abc123",
        },
      ],
    })

    await createFormCheckpoint({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
    })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.importedFromStapleVersionNumber).toBe(5)
    expect(data.importedAt).toEqual(new Date("2026-08-01T00:00:00.000Z"))
    expect(data.originalImportHash).toBe("sha256:abc123")
  })

  it("stays null for a native form with no STAPLE lineage", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      versions: [
        {
          id: VERSION_ID,
          version: 3,
          status: "DRAFT",
          updatedAt: UPDATED_AT,
          importedFromStapleVersionNumber: null,
          importedAt: null,
          originalImportHash: null,
        },
      ],
    })

    await createFormCheckpoint({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
    })

    const data = createMarkerFormVersion.mock.calls[0][0].data
    expect(data.importedFromStapleVersionNumber).toBeNull()
    expect(data.importedAt).toBeNull()
    expect(data.originalImportHash).toBeNull()
  })
})
