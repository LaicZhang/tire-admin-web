import { filterEmptyParams, filterEmptyParamsKeepArrays } from "../params";

describe("params filters", () => {
  it("removes empty primitives but keeps falsy meaningful values", () => {
    expect(
      filterEmptyParams({
        a: "",
        b: undefined,
        c: null,
        d: 0,
        e: false,
        f: [],
        g: "x"
      })
    ).toEqual({ d: 0, e: false, f: [], g: "x" });
  });

  it("keeps arrays including empty arrays", () => {
    expect(
      filterEmptyParamsKeepArrays({
        a: "",
        b: undefined,
        c: null,
        d: [],
        e: [1],
        f: 0
      })
    ).toEqual({ d: [], e: [1], f: 0 });
  });
});
