import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchemaStatusBadges } from "./SchemaStatusBadges";
import type { FormVersionDTO } from "@/features/forms/types";

function version(overrides: Partial<FormVersionDTO> = {}): FormVersionDTO {
  return {
    id: 1,
    name: "Test schema",
    version: 1,
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
    schema: {},
    uiSchema: {},
    semantics: null,
    publicationMetadata: null,
    publishedSchema: null,
    stapleProvenance: null,
    ...overrides,
  };
}

describe("SchemaStatusBadges", () => {
  it("shows only the draft version badge for a draft, no Published badge", () => {
    render(<SchemaStatusBadges version={version({ status: "DRAFT", version: 3 })} />);

    expect(screen.getByText("Draft 3")).toBeInTheDocument();
    expect(screen.queryByText("Published")).not.toBeInTheDocument();
  });

  it("puts the PID in a tooltip on the Published badge rather than as visible text", () => {
    render(
      <SchemaStatusBadges
        version={version({
          status: "PUBLISHED",
          publishedSchema: {
            pid: "ps_abc123",
            version: "1.0.0",
            license: "CC-BY-4.0",
            domain: null,
            language: "en",
            releaseNotes: null,
            keywords: [],
            contributors: [],
          },
        })}
      />
    );

    const publishedBadge = screen.getByText("Published");
    expect(publishedBadge.getAttribute("data-tip")).toBe("PID: ps_abc123");
    expect(screen.queryByText(/ps_abc123/)).not.toBeInTheDocument();
  });

  it("gives the Published badge no tooltip when there's somehow no PID", () => {
    render(<SchemaStatusBadges version={version({ status: "PUBLISHED", publishedSchema: null })} />);

    const publishedBadge = screen.getByText("Published");
    expect(publishedBadge.getAttribute("data-tip")).toBeNull();
  });
});
