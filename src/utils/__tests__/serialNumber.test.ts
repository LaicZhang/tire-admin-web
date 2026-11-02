import { describe, expect, it } from "vitest";
import {
  formatSerialNoListText,
  formatSerialNumbersText,
  parseSerialNoListText,
  parseSerialNumbersText
} from "../serialNumber";

describe("serial number text parsing", () => {
  it("parses tab/comma fields, trims values and joins remarks", () => {
    expect(
      parseSerialNumbersText(
        "\n SN-001\tDOT-1\t2025\t12\tfirst, remark\n" + "SN-002，DOT-2,2026,3"
      )
    ).toEqual([
      {
        serialNo: "SN-001",
        dotCode: "DOT-1",
        dotYear: 2025,
        dotWeek: 12,
        remark: "first remark"
      },
      { serialNo: "SN-002", dotCode: "DOT-2", dotYear: 2026, dotWeek: 3 }
    ]);
  });

  it("drops blanks, duplicate serials and invalid numeric fields", () => {
    expect(
      parseSerialNumbersText(
        "\n \nSN-001\tDOT\tbad\t2025\t\nSN-001\tOTHER\n\tDOT\nSN-002"
      )
    ).toEqual([
      { serialNo: "SN-001", dotCode: "DOT", dotWeek: 2025 },
      { serialNo: "DOT" },
      { serialNo: "SN-002" }
    ]);
  });

  it("returns an empty list for absent text", () => {
    expect(parseSerialNumbersText()).toEqual([]);
    expect(parseSerialNumbersText(null)).toEqual([]);
    expect(parseSerialNumbersText("")).toEqual([]);
  });

  it("formats payloads and omits absent optional fields", () => {
    expect(
      formatSerialNumbersText([
        {
          serialNo: "SN-001",
          dotCode: "DOT",
          dotYear: 2025,
          dotWeek: 2,
          remark: "note"
        },
        { serialNo: "SN-002" }
      ])
    ).toBe("SN-001\tDOT\t2025\t2\tnote\nSN-002");
    expect(formatSerialNumbersText([])).toBe("");
    expect(formatSerialNumbersText(null)).toBe("");
  });

  it("deduplicates and trims serial number lists", () => {
    expect(parseSerialNoListText("\n A \r\nB\nA\n\n C ")).toEqual([
      "A",
      "B",
      "C"
    ]);
    expect(parseSerialNoListText()).toEqual([]);
    expect(parseSerialNoListText(null)).toEqual([]);
    expect(parseSerialNoListText("")).toEqual([]);
    expect(formatSerialNoListText([" A ", "", "B"])).toBe("A\nB");
    expect(formatSerialNoListText([])).toBe("");
    expect(formatSerialNoListText(null)).toBe("");
  });
});
