import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("batch list pagination contract", () => {
  it("passes the current page and page size to the batch API", () => {
    const source = readFileSync(resolve(__dirname, "index.vue"), "utf8");

    expect(source).toMatch(
      /getBatchListApi\(\{[\s\S]*page,[\s\S]*pageSize,[\s\S]*\.\.\.queryForm\.value/
    );
  });
});
