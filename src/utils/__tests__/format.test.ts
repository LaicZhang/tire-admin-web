import { formatFileSize } from "../format";

describe("formatFileSize", () => {
  it.each([
    [null, "-"],
    [undefined, "custom"],
    [Number.NaN, "-"],
    [-1, "-"],
    [0, "0 B"],
    [1023, "1023 B"],
    [1024, "1.00 KB"],
    [1024 * 1024, "1.00 MB"],
    [1024 ** 3, "1.00 GB"]
  ])("formats %s", (value, expected) => {
    expect(
      formatFileSize(
        value as number | null | undefined,
        expected === "custom" ? { emptyText: "custom" } : undefined
      )
    ).toBe(expected);
  });

  it("honours decimal precision", () => {
    expect(formatFileSize(1536, { decimals: 1 })).toBe("1.5 KB");
  });
});
