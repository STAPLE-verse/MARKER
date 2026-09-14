import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const USER_ID = 1;

const findFirstUser = vi.fn();
const updateUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => findFirstUser(...args),
      update: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateProfile } from "./updateProfile";

const VALID_INPUT = {
  username: "ada",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  institution: "Analytical Engines Ltd",
  orcid: "0000-0002-1825-0097",
  gravatar: "ada@example.com",
  language: "en-US",
  theme: "dark",
};

describe("updateProfile", () => {
  beforeEach(() => {
    findFirstUser.mockReset();
    updateUser.mockReset();
    // No conflicting user by default.
    findFirstUser.mockResolvedValue(null);
    updateUser.mockResolvedValue(VALID_INPUT);
  });

  it("writes the trimmed/normalized fields and reports success", async () => {
    const res = await updateProfile({
      ...VALID_INPUT,
      username: "  ada  ",
      firstName: "  Ada  ",
      gravatar: "  Ada@Example.com  ",
    });

    expect(res.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: {
        username: "ada",
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        institution: "Analytical Engines Ltd",
        orcid: "0000-0002-1825-0097",
        gravatar: "ada@example.com",
        language: "en-US",
        theme: "dark",
      },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        institution: true,
        orcid: true,
        gravatar: true,
        language: true,
        theme: true,
      },
    });
  });

  it("stores blank optional fields as null instead of empty strings", async () => {
    await updateProfile({
      ...VALID_INPUT,
      firstName: "",
      lastName: "",
      institution: "",
      orcid: "",
      gravatar: "",
    });

    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: null,
          lastName: null,
          institution: null,
          orcid: null,
          gravatar: null,
        }),
      })
    );
  });

  it("rejects a malformed ORCID before touching the database", async () => {
    const res = await updateProfile({ ...VALID_INPUT, orcid: "not-an-orcid" });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.fieldErrors?.orcid).toBeTruthy();
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed gravatar email before touching the database", async () => {
    const res = await updateProfile({ ...VALID_INPUT, gravatar: "not-an-email" });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.fieldErrors?.gravatar).toBeTruthy();
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a language outside the supported list", async () => {
    const res = await updateProfile({ ...VALID_INPUT, language: "fr-FR" });

    expect(res.ok).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a theme outside the supported list", async () => {
    const res = await updateProfile({ ...VALID_INPUT, theme: "solarized" });

    expect(res.ok).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a username already used by another account, as a field error", async () => {
    findFirstUser.mockImplementation(async ({ where }: { where: { username?: string } }) =>
      where.username ? { id: 99 } : null
    );

    const res = await updateProfile(VALID_INPUT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fieldErrors?.username?.[0]).toMatch(/already taken/i);
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects an email already used by another account, as a field error", async () => {
    findFirstUser.mockImplementation(async ({ where }: { where: { email?: string } }) =>
      where.email ? { id: 99 } : null
    );

    const res = await updateProfile(VALID_INPUT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fieldErrors?.email?.[0]).toMatch(/already in use/i);
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("excludes the caller's own row from the conflict check", async () => {
    await updateProfile(VALID_INPUT);

    for (const call of findFirstUser.mock.calls) {
      expect(call[0].where.NOT).toEqual({ id: USER_ID });
    }
  });

  it("falls back to a generic conflict error if the write itself races another update", async () => {
    updateUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`username`)", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    const res = await updateProfile(VALID_INPUT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("CONFLICT");
    }
  });
});
