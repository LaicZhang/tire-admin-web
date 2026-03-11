import { describe, it, expect, vi, afterEach } from "vitest";

function mockCrypto(value: unknown) {
  const desc = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  if (desc?.get) {
    return vi
      .spyOn(globalThis as unknown as { crypto: unknown }, "crypto", "get")
      .mockReturnValue(value);
  }

  throw new Error("globalThis.crypto is not a getter; test needs update");
}

describe("createUid", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("uuid");
    vi.restoreAllMocks();
  });

  it("should use crypto.randomUUID when available", async () => {
    const v7 = vi.fn(() => "uuid-v7");
    vi.doMock("uuid", () => ({ v7 }));
    mockCrypto({ randomUUID: () => "native-uuid" });

    const { createUid } = await import("../uid");
    expect(createUid()).toBe("native-uuid");
    expect(v7).not.toHaveBeenCalled();
  });

  it("should fallback to uuid.v7 when randomUUID is missing", async () => {
    const v7 = vi.fn(() => "uuid-v7");
    vi.doMock("uuid", () => ({ v7 }));
    mockCrypto({});

    const { createUid } = await import("../uid");
    expect(createUid()).toBe("uuid-v7");
    expect(v7).toHaveBeenCalledTimes(1);
  });
});
