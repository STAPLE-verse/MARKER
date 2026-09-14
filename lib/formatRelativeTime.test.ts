import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const NOW = new Date("2026-09-10T12:00:00.000Z");

describe("formatRelativeTime", () => {
  it("returns 'just now' for anything under a minute old", () => {
    expect(formatRelativeTime(new Date("2026-09-10T11:59:30.000Z"), NOW)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(new Date("2026-09-10T11:55:00.000Z"), NOW)).toBe("5 minutes ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(new Date("2026-09-10T10:00:00.000Z"), NOW)).toBe("2 hours ago");
  });

  it("formats days", () => {
    expect(formatRelativeTime(new Date("2026-09-07T12:00:00.000Z"), NOW)).toBe("3 days ago");
  });

  it("formats a future timestamp without crashing", () => {
    expect(formatRelativeTime(new Date("2026-09-10T14:00:00.000Z"), NOW)).toBe("in 2 hours");
  });
});
