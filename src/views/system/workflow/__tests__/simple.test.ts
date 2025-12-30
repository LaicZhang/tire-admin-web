import { describe, it, expect } from "vitest";

describe("simple", () => {
  it("has localStorage", () => {
    expect(localStorage).toBeDefined();
    console.log("localStorage:", localStorage);
    expect(typeof localStorage.getItem).toBe("function");
  });
});
