import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isDirtyVsDbBaseline, useFormDraft, type DbBaseline } from "./useFormDraft";

const FORM_ID = 1;
const VERSION_ID = 10;

const baseline: DbBaseline = {
  schema: { type: "object", properties: {} },
  uiSchema: {},
  semantics: null,
};

describe("isDirtyVsDbBaseline", () => {
  it("is not dirty when schema, uiSchema, and semantics all match the baseline", () => {
    expect(
      isDirtyVsDbBaseline(baseline.schema, baseline.uiSchema, baseline.semantics, baseline)
    ).toBe(false);
  });

  it("is dirty when only semantics changed — schema/uiSchema unchanged", () => {
    const semantics = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };
    expect(isDirtyVsDbBaseline(baseline.schema, baseline.uiSchema, semantics, baseline)).toBe(
      true
    );
  });

  it("is dirty when schema changed but semantics did not", () => {
    const schema = { type: "object", properties: { name: { type: "string" } } };
    expect(isDirtyVsDbBaseline(schema, baseline.uiSchema, baseline.semantics, baseline)).toBe(
      true
    );
  });

  it("is not dirty when semantics is explicitly null on both sides", () => {
    const withSemantics: DbBaseline = {
      ...baseline,
      semantics: { root: { classIri: "https://schema.org/Thing" }, bindings: [] },
    };
    expect(
      isDirtyVsDbBaseline(
        withSemantics.schema,
        withSemantics.uiSchema,
        withSemantics.semantics,
        withSemantics
      )
    ).toBe(false);
  });
});

describe("useFormDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("loads with no draft to restore when localStorage is empty", async () => {
    const { result } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));

    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    expect(result.current.draftToRestore).toBeNull();
  });

  it("round-trips semantics through saveDraft and restoreDraft", async () => {
    const semantics = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };
    const { result, unmount } = renderHook(() =>
      useFormDraft(FORM_ID, VERSION_ID, baseline)
    );
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));

    act(() => {
      result.current.saveDraft(baseline.schema, baseline.uiSchema, semantics);
    });
    unmount();

    // A fresh mount (e.g. after a crash/reload) should offer the saved draft.
    const { result: reloaded } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));
    await waitFor(() => expect(reloaded.current.draftLoaded).toBe(true));
    expect(reloaded.current.draftToRestore?.semantics).toEqual(semantics);

    act(() => {
      reloaded.current.restoreDraft();
    });
    expect(reloaded.current.currentSemantics).toEqual(semantics);
  });

  it("does not persist a draft when only content matches the baseline (nothing changed)", async () => {
    const { result } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));

    act(() => {
      result.current.saveDraft(baseline.schema, baseline.uiSchema, baseline.semantics);
    });

    const { result: reloaded } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));
    await waitFor(() => expect(reloaded.current.draftLoaded).toBe(true));
    expect(reloaded.current.draftToRestore).toBeNull();
  });

  it("persists a draft for a semantics-only change even though schema/uiSchema match the baseline", async () => {
    const semantics = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };
    const { result } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));

    act(() => {
      result.current.saveDraft(baseline.schema, baseline.uiSchema, semantics);
    });

    const { result: reloaded } = renderHook(() => useFormDraft(FORM_ID, VERSION_ID, baseline));
    await waitFor(() => expect(reloaded.current.draftLoaded).toBe(true));
    expect(reloaded.current.draftToRestore?.semantics).toEqual(semantics);
  });
});
