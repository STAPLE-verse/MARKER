import { describe, expect, it, vi, beforeEach } from "vitest";

const USER_ID = 1;

const updateUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateProfile } from "./updateProfile";

describe("updateProfile", () => {
  beforeEach(() => {
    updateUser.mockReset();
    updateUser.mockResolvedValue({
      firstName: "Ada",
      lastName: "Lovelace",
      institution: "Analytical Engines Ltd",
      orcid: "0000-0002-1825-0097",
      gravatar: "ada@example.com",
      language: "en-US",
    });
  });

  it("writes the trimmed fields and reports success", async () => {
    const res = await updateProfile({
      firstName: "  Ada  ",
      lastName: "Lovelace",
      institution: "Analytical Engines Ltd",
      orcid: "0000-0002-1825-0097",
      gravatar: "  Ada@Example.com  ",
      language: "en-US",
    });

    expect(res.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: {
        firstName: "Ada",
        lastName: "Lovelace",
        institution: "Analytical Engines Ltd",
        orcid: "0000-0002-1825-0097",
        gravatar: "ada@example.com",
        language: "en-US",
      },
      select: {
        firstName: true,
        lastName: true,
        institution: true,
        orcid: true,
        gravatar: true,
        language: true,
      },
    });
  });

  it("stores blank optional fields as null instead of empty strings", async () => {
    await updateProfile({
      firstName: "",
      lastName: "",
      institution: "",
      orcid: "",
      gravatar: "",
      language: "en-US",
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
    const res = await updateProfile({
      firstName: "Ada",
      lastName: "Lovelace",
      institution: "",
      orcid: "not-an-orcid",
      gravatar: "",
      language: "en-US",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.fieldErrors?.orcid).toBeTruthy();
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed gravatar email before touching the database", async () => {
    const res = await updateProfile({
      firstName: "",
      lastName: "",
      institution: "",
      orcid: "",
      gravatar: "not-an-email",
      language: "en-US",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.fieldErrors?.gravatar).toBeTruthy();
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a language outside the supported list", async () => {
    const res = await updateProfile({
      firstName: "",
      lastName: "",
      institution: "",
      orcid: "",
      gravatar: "",
      language: "fr-FR",
    });

    expect(res.ok).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });
});
