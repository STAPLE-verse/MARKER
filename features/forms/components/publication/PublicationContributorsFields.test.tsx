import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { strictPublicationContributorSchema } from "@/features/forms/schemas";
import { PublicationContributorsFields } from "./PublicationContributorsFields";

const formSchema = z.object({
  contributors: z.array(strictPublicationContributorSchema),
});
type FormValues = z.infer<typeof formSchema>;

const NO_CONTRIBUTORS_TEXT = "No contributors added yet.";

function Harness() {
  const { control, formState, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { contributors: [] },
  });

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <PublicationContributorsFields control={control} errors={formState.errors} />
    </form>
  );
}

describe("ContributorEditorModal save-time validation", () => {
  it("blocks Save and stays open when Given/Family Name are both left blank", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add contributor/i }));

    const dialog = await screen.findByRole("dialog");
    // Select a role so the only remaining problem is the missing name.
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Author" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    // Modal stays open, nothing was committed.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(NO_CONTRIBUTORS_TEXT)).toBeInTheDocument();
    expect(within(dialog).getByText("Name is required")).toBeInTheDocument();
  });

  it("saves and closes once a name and a role are both provided", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add contributor/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByPlaceholderText("Jane"), { target: { value: "Jane" } });
    fireEvent.change(within(dialog).getByPlaceholderText("Doe"), { target: { value: "Doe" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Author" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(NO_CONTRIBUTORS_TEXT)).not.toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("blocks Save when a name is provided but no role is selected", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add contributor/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByPlaceholderText("Jane"), { target: { value: "Jane" } });
    fireEvent.change(within(dialog).getByPlaceholderText("Doe"), { target: { value: "Doe" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(NO_CONTRIBUTORS_TEXT)).toBeInTheDocument();
    expect(within(dialog).getByText("At least one role is required")).toBeInTheDocument();
  });
});
