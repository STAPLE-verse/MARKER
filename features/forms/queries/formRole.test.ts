import { describe, expect, it } from "vitest"
import { ActionError } from "@/utils/action-result"
import { assertFormRole, resolveFormRole, roleSatisfies } from "./formRole"

const OWNER_ID = 1
const EDITOR_ID = 2
const VIEWER_ID = 3
const STRANGER_ID = 4

describe("resolveFormRole", () => {
  it("resolves the owner to OWNER even with no collaborator row", () => {
    expect(resolveFormRole({ ownerId: OWNER_ID, collaborators: [] }, OWNER_ID)).toBe("OWNER")
  })

  it("resolves an accepted collaborator to their own role", () => {
    expect(
      resolveFormRole({ ownerId: OWNER_ID, collaborators: [{ role: "EDITOR" }] }, EDITOR_ID)
    ).toBe("EDITOR")
    expect(
      resolveFormRole({ ownerId: OWNER_ID, collaborators: [{ role: "VIEWER" }] }, VIEWER_ID)
    ).toBe("VIEWER")
  })

  it("resolves null for a user with no relationship to the form", () => {
    expect(resolveFormRole({ ownerId: OWNER_ID, collaborators: [] }, STRANGER_ID)).toBeNull()
  })

  it("does not crash when collaborators is missing from a loose caller shape", () => {
    expect(
      resolveFormRole({ ownerId: OWNER_ID } as never, STRANGER_ID)
    ).toBeNull()
  })
})

describe("roleSatisfies", () => {
  it("ranks OWNER > EDITOR > VIEWER", () => {
    expect(roleSatisfies("OWNER", "VIEWER")).toBe(true)
    expect(roleSatisfies("OWNER", "EDITOR")).toBe(true)
    expect(roleSatisfies("EDITOR", "VIEWER")).toBe(true)
    expect(roleSatisfies("EDITOR", "OWNER")).toBe(false)
    expect(roleSatisfies("VIEWER", "EDITOR")).toBe(false)
  })

  it("is satisfied by an exact match", () => {
    expect(roleSatisfies("EDITOR", "EDITOR")).toBe(true)
  })
})

describe("assertFormRole", () => {
  const form = { ownerId: OWNER_ID, collaborators: [{ role: "EDITOR" as const }] }

  it("passes silently when the resolved role meets the minimum", () => {
    expect(() => assertFormRole(form, OWNER_ID, "OWNER")).not.toThrow()
    expect(() => assertFormRole(form, EDITOR_ID, "EDITOR")).not.toThrow()
  })

  it("throws FORBIDDEN when the resolved role is below the minimum", () => {
    expect(() => assertFormRole(form, EDITOR_ID, "OWNER")).toThrow(ActionError)
    try {
      assertFormRole(form, EDITOR_ID, "OWNER")
    } catch (e) {
      expect(e).toBeInstanceOf(ActionError)
      expect((e as ActionError).code).toBe("FORBIDDEN")
    }
  })

  it("throws FORBIDDEN when the user has no relationship to the form at all", () => {
    const formWithNoCollaborators = { ownerId: OWNER_ID, collaborators: [] }
    expect(() => assertFormRole(formWithNoCollaborators, STRANGER_ID, "VIEWER")).toThrow(ActionError)
  })

  it("uses the provided message override", () => {
    const formWithNoCollaborators = { ownerId: OWNER_ID, collaborators: [] }
    try {
      assertFormRole(formWithNoCollaborators, STRANGER_ID, "VIEWER", "custom message")
    } catch (e) {
      expect((e as ActionError).message).toBe("custom message")
    }
  })
})
