import { describe, expect, it } from "vitest";
import { renderFormOwnershipTransferred } from "./formOwnershipTransferred";

describe("renderFormOwnershipTransferred", () => {
  it("names the previous owner and the form", () => {
    const { message } = renderFormOwnershipTransferred({
      formId: 42,
      formTitle: "Cognitive Assessment",
      previousOwnerUsername: "jane_doe",
    });

    expect(message).toBe('jane_doe made you the owner of "Cognitive Assessment".');
  });

  it("routes straight to the form, since the new owner now has full access", () => {
    const { routeData } = renderFormOwnershipTransferred({
      formId: 42,
      formTitle: "Schema",
      previousOwnerUsername: "jane_doe",
    });

    expect(routeData).toEqual({ path: "/collection/42" });
  });
});
