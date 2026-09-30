import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "./Textarea";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("renders formatting, lists and links", () => {
    render(<Markdown>{"# Title\n\nSome **bold** text.\n\n- one\n- two\n\n[guide](https://example.org)"}</Markdown>);

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const link = screen.getByRole("link", { name: "guide" });
    expect(link).toHaveAttribute("href", "https://example.org");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("keeps single line breaks and does not render raw HTML", () => {
    const { container } = render(<Markdown>{"line one\nline two\n\n<script>alert(1)</script>"}</Markdown>);

    expect(container.querySelector("br")).not.toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});

describe("Textarea", () => {
  it("has no toolbar by default", () => {
    render(<Textarea label="Notes" />);

    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });

  it("previews what was typed as Markdown, and keeps the text when switching back", () => {
    render(<Textarea label="Description" markdown />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Some **bold** text" } });

    fireEvent.click(screen.getByText("Preview"));

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    // Still in the document (just hidden), so a form library can read its value.
    expect(textarea).toBeInTheDocument();
    expect(textarea.className).toContain("hidden");

    fireEvent.click(screen.getByText("Edit"));

    expect(textarea.className).not.toContain("hidden");
    expect(textarea.value).toBe("Some **bold** text");
  });

  it("shows a placeholder message when previewing nothing", () => {
    render(<Textarea markdown />);

    fireEvent.click(screen.getByText("Preview"));

    expect(screen.getByText("Nothing to preview yet…")).toBeInTheDocument();
  });
});
