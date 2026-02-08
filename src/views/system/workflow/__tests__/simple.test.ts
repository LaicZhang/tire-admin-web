import { describe, it, expect } from "vitest";

describe("simple", () => {
  it("has localStorage", () => {
    expect(localStorage).toBeDefined();
    expect(typeof localStorage.getItem).toBe("function");
  });
});
