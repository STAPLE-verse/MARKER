import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { strictPublicationContributorSchema } from "@/features/forms/schemas";
import type { ContributorSuggestionDTO } from "@/features/forms/collaborators/types";

// None of the first describe block's tests pass `formId`, so the component's
// suggestion-fetching effect never actually calls this — mocked purely so
// importing the component doesn't drag the real "use server" action (and
// therefore next-auth's module graph) into this test file at all.
const getFormContributorSuggestions = vi.fn<
  (...args: unknown[]) => Promise<{ ok: true; data: ContributorSuggestionDTO[] }>
>(async () => ({ ok: true, data: [] }));
vi.mock("@/features/forms/collaborators/actions/getFormContributorSuggestions", () => ({
  getFormContributorSuggestions: (...args: unknown[]) => getFormContributorSuggestions(...args),
}));

import { PublicationContributorsFields } from "./PublicationContributorsFields";

const formSchema = z.object({
  contributors: z.array(strictPublicationContributorSchema),
});
type FormValues = z.infer<typeof formSchema>;

const NO_CONTRIBUTORS_TEXT = "No contributors added yet.";

function Harness({ formId }: { formId?: number } = {}) {
  const { control, formState, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { contributors: [] },
  });

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <PublicationContributorsFields control={control} errors={formState.errors} formId={formId} />
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

  it("blocks Save when the ORCID is malformed, even with a valid name and role", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /add contributor/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByPlaceholderText("Jane"), { target: { value: "Jane" } });
    fireEvent.change(within(dialog).getByPlaceholderText("Doe"), { target: { value: "Doe" } });
    fireEvent.change(within(dialog).getByPlaceholderText("0000-0000-0000-0000"), {
      target: { value: "not-an-orcid" },
    });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Author" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(NO_CONTRIBUTORS_TEXT)).toBeInTheDocument();
    expect(within(dialog).getByText("Must be a valid ORCID (e.g. 0000-0002-1825-0097)")).toBeInTheDocument();
  });
});

describe("collaborator contributor suggestions", () => {
  beforeEach(() => {
    getFormContributorSuggestions.mockReset();
  });

  it("does not fetch suggestions when formId is omitted", () => {
    getFormContributorSuggestions.mockResolvedValue({ ok: true, data: [] });
    render(<Harness />);

    expect(getFormContributorSuggestions).not.toHaveBeenCalled();
  });

  it("renders a chip per suggestion once fetched", async () => {
    getFormContributorSuggestions.mockResolvedValue({
      ok: true,
      data: [{ userId: 1, name: "Jane Owner", givenName: "Jane", familyName: "Owner", orcid: undefined, affiliations: [] }],
    });
    render(<Harness formId={42} />);

    expect(await screen.findByRole("button", { name: /Jane Owner/ })).toBeInTheDocument();
  });

  it("clicking a suggestion appends it to the list with no roles pre-selected", async () => {
    getFormContributorSuggestions.mockResolvedValue({
      ok: true,
      data: [{ userId: 1, name: "Jane Owner", givenName: "Jane", familyName: "Owner", orcid: undefined, affiliations: [] }],
    });
    render(<Harness formId={42} />);

    fireEvent.click(await screen.findByRole("button", { name: /Jane Owner/ }));

    expect(screen.getByText("Jane Owner")).toBeInTheDocument();
    expect(screen.queryByText(NO_CONTRIBUTORS_TEXT)).not.toBeInTheDocument();
    // The chip itself is gone now that its suggestion is already in the list.
    expect(screen.queryByRole("button", { name: /Jane Owner/ })).not.toBeInTheDocument();
  });

  it("does not hide other suggestions that happen to share an ORCID with the one just added", async () => {
    getFormContributorSuggestions.mockResolvedValue({
      ok: true,
      data: [
        { userId: 1, name: "Alice A", givenName: "Alice", familyName: "A", orcid: "0000-0000-0000-0001", affiliations: [] },
        { userId: 2, name: "Bob B", givenName: "Bob", familyName: "B", orcid: "0000-0000-0000-0001", affiliations: [] },
      ],
    });
    render(<Harness formId={42} />);

    expect(await screen.findByRole("button", { name: /Alice A/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bob B/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alice A/ }));

    expect(screen.queryByRole("button", { name: /Alice A/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bob B/ })).toBeInTheDocument();
  });
});
