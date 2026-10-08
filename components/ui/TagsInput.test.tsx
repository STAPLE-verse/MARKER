import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagsInput } from "./TagsInput";

// Each tag renders its own remove button (the library labels them by tag index)
const removeButton = (index: number) =>
  screen.getByRole("button", { name: new RegExp(`^Tag at index ${index} `) });

describe("TagsInput", () => {
  // An error thrown inside a click handler is reported on window, not by fireEvent
  let uncaught: unknown[] = [];
  const collect = (event: ErrorEvent) => {
    uncaught.push(event.error);
    event.preventDefault();
  };
  beforeEach(() => {
    uncaught = [];
    window.addEventListener("error", collect);
  });
  afterEach(() => {
    window.removeEventListener("error", collect);
    expect(uncaught).toEqual([]);
  });

  it("removes a tag that is not the first one without crashing", () => {
    const onChange = vi.fn();
    render(<TagsInput value={["alpha", "beta", "gamma"]} onChange={onChange} />);
    fireEvent.click(removeButton(1));
    expect(onChange).toHaveBeenCalledWith(["alpha", "gamma"]);
  });

  it("removes the first tag while others remain without crashing", () => {
    const onChange = vi.fn();
    render(<TagsInput value={["alpha", "beta"]} onChange={onChange} />);
    fireEvent.click(removeButton(0));
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("removes the only tag", () => {
    const onChange = vi.fn();
    render(<TagsInput value={["alpha"]} onChange={onChange} />);
    fireEvent.click(removeButton(0));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("adds a tag when Enter is pressed", () => {
    const onChange = vi.fn();
    render(<TagsInput value={["alpha"]} onChange={onChange} placeholder="Add keywords..." />);
    const input = screen.getByPlaceholderText("Add keywords...");
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["alpha", "beta"]);
  });
});
