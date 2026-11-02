import { getRandomName } from "../mock";
import { toUploadProgressEvent } from "../uploadProgress";

describe("misc utilities", () => {
  it("creates deterministic-length random Chinese names", () => {
    expect(getRandomName()).toHaveLength(3);
    expect(getRandomName(8)).toHaveLength(8);
    expect(getRandomName(0)).toBe("");
  });

  it.each([-10, 0, 50, 100, 150, Number.NaN, Number.POSITIVE_INFINITY])(
    "normalizes upload progress %s",
    value => {
      const event = toUploadProgressEvent(value);
      const expected = Number.isFinite(value)
        ? Math.min(100, Math.max(0, value))
        : 0;
      expect(event.percent).toBe(expected);
      expect(event.type).toBe("progress");
    }
  );

  it("falls back to Event when ProgressEvent is absent", () => {
    vi.stubGlobal("ProgressEvent", undefined);
    const event = toUploadProgressEvent(25);
    expect(event).toBeInstanceOf(Event);
    expect(event.percent).toBe(25);
    vi.unstubAllGlobals();
  });
});
