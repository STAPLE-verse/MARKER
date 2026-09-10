import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyPublishedSchema = vi.fn();
const findManyMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: {
      findMany: (...args: unknown[]) => findManyPublishedSchema(...args),
    },
    markerForm: {
      findMany: (...args: unknown[]) => findManyMarkerForm(...args),
    },
  },
}));

import { getRecentActivity } from "./getRecentActivity";

describe("getRecentActivity", () => {
  beforeEach(() => {
    findManyPublishedSchema.mockReset();
    findManyMarkerForm.mockReset();
    findManyPublishedSchema.mockResolvedValue([]);
    findManyMarkerForm.mockResolvedValue([]);
  });

  it("returns an empty feed for a brand-new user", async () => {
    expect(await getRecentActivity(1)).toEqual([]);
  });

  it("maps a published schema to a PUBLISHED item linking back to its origin draft", async () => {
    findManyPublishedSchema.mockResolvedValue([
      {
        pid: "ps_abc123",
        title: "Cognitive Assessment Template",
        version: "1.0.0",
        createdAt: new Date("2026-09-05T00:00:00.000Z"),
        originFormVersion: { formId: 42 },
      },
    ]);

    const result = await getRecentActivity(1);

    expect(result).toEqual([
      {
        type: "PUBLISHED",
        title: "Cognitive Assessment Template",
        version: "1.0.0",
        timestamp: new Date("2026-09-05T00:00:00.000Z"),
        href: "/collection/42",
      },
    ]);
  });

  it("falls back to the public catalog page when a published schema's origin draft is gone", async () => {
    findManyPublishedSchema.mockResolvedValue([
      {
        pid: "ps_abc123",
        title: "Cognitive Assessment Template",
        version: "1.0.0",
        createdAt: new Date("2026-09-05T00:00:00.000Z"),
        originFormVersion: null,
      },
    ]);

    const result = await getRecentActivity(1);

    expect(result[0].href).toBe("/schemas/ps_abc123");
  });

  it("merges CREATED, IMPORTED_STAPLE, and FORKED forms sorted newest first across all four sources", async () => {
    findManyPublishedSchema.mockResolvedValue([
      {
        pid: "ps_1",
        title: "Published One",
        version: "1.0.0",
        createdAt: new Date("2026-09-03T00:00:00.000Z"),
        originFormVersion: { formId: 1 },
      },
    ]);
    // The three markerForm.findMany calls happen in NATIVE, IMPORTED_STAPLE,
    // FORKED order (see getRecentActivity.ts) — mock each call in that order.
    findManyMarkerForm
      .mockResolvedValueOnce([
        { id: 2, createdAt: new Date("2026-09-01T00:00:00.000Z"), versions: [{ name: "Native Draft" }] },
      ])
      .mockResolvedValueOnce([
        {
          id: 3,
          importedAt: new Date("2026-09-04T00:00:00.000Z"),
          versions: [{ name: "Imported Form" }],
        },
      ])
      .mockResolvedValueOnce([
        { id: 4, forkedAt: new Date("2026-09-02T00:00:00.000Z"), versions: [{ name: "Forked Form" }] },
      ]);

    const result = await getRecentActivity(1);

    expect(result.map((item) => item.type)).toEqual([
      "IMPORTED_STAPLE",
      "PUBLISHED",
      "FORKED",
      "CREATED",
    ]);
    expect(result.map((item) => item.href)).toEqual([
      "/collection/3",
      "/collection/1",
      "/collection/4",
      "/collection/2",
    ]);
  });

  it("falls back to 'Untitled Draft' when a form has no non-archived version", async () => {
    findManyMarkerForm.mockResolvedValueOnce([
      { id: 5, createdAt: new Date("2026-09-01T00:00:00.000Z"), versions: [] },
    ]);

    const result = await getRecentActivity(1);

    expect(result[0].title).toBe("Untitled Draft");
  });
});
