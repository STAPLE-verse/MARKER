import { describe, expect, it } from "vitest"
import { getImportModificationStatus, hashImportedSnapshot } from "./importHash"

describe("hashImportedSnapshot", () => {
  it("is independent of object key order", () => {
    const a = hashImportedSnapshot({ type: "object", title: "Form" }, {})
    const b = hashImportedSnapshot({ title: "Form", type: "object" }, {})
    expect(a).toBe(b)
  })

  it("is sensitive to array order", () => {
    const a = hashImportedSnapshot({ required: ["a", "b"] }, {})
    const b = hashImportedSnapshot({ required: ["b", "a"] }, {})
    expect(a).not.toBe(b)
  })

  it("treats missing and null uiSchema as {}", () => {
    const missing = hashImportedSnapshot({ type: "object" }, undefined)
    const nullValue = hashImportedSnapshot({ type: "object" }, null)
    const empty = hashImportedSnapshot({ type: "object" }, {})
    expect(missing).toBe(empty)
    expect(nullValue).toBe(empty)
  })

  it("includes schema.title in the hash", () => {
    const a = hashImportedSnapshot({ title: "A" }, {})
    const b = hashImportedSnapshot({ title: "B" }, {})
    expect(a).not.toBe(b)
  })

  it("produces a sha256:<hex> string", () => {
    const hash = hashImportedSnapshot({ type: "object" }, {})
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/)
  })
})

describe("getImportModificationStatus", () => {
  const schema = { type: "object", title: "Form" }
  const uiSchema = {}

  it("returns UNKNOWN when there is no recorded baseline", () => {
    expect(
      getImportModificationStatus({ latestImportedContentHash: null, schema, uiSchema })
    ).toBe("UNKNOWN")
  })

  it("returns UNKNOWN for an unrecognized hash format", () => {
    expect(
      getImportModificationStatus({ latestImportedContentHash: "md5:abc", schema, uiSchema })
    ).toBe("UNKNOWN")
  })

  it("returns UNMODIFIED when current content matches the baseline", () => {
    const baseline = hashImportedSnapshot(schema, uiSchema)
    expect(
      getImportModificationStatus({ latestImportedContentHash: baseline, schema, uiSchema })
    ).toBe("UNMODIFIED")
  })

  it("returns MODIFIED when current content diverges from the baseline", () => {
    const baseline = hashImportedSnapshot(schema, uiSchema)
    expect(
      getImportModificationStatus({
        latestImportedContentHash: baseline,
        schema: { ...schema, title: "Changed" },
        uiSchema,
      })
    ).toBe("MODIFIED")
  })
})
