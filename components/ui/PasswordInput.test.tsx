import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("masks the value by default and reveals it on toggle", () => {
    render(<PasswordInput label="Password" placeholder="••••••••" />);

    const input = screen.getByPlaceholderText("••••••••");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not submit the surrounding form when the toggle is clicked", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput label="Password" placeholder="••••••••" />
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("forwards the ref and passthrough props like a plain Input", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <PasswordInput
        label="Password"
        placeholder="••••••••"
        name="password"
        error="Required"
        ref={ref}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("name", "password");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});
