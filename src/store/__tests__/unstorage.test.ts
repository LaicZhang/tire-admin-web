import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const client = {
    setItems: vi.fn().mockResolvedValue(undefined),
    getItems: vi.fn().mockResolvedValue(["item"]),
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue({ value: 1 })
  };
  return {
    client,
    createStorage: vi.fn(() => client),
    indexedDbDriver: vi.fn((options: unknown) => ({
      driver: "indexeddb",
      options
    })),
    localStorageDriver: vi.fn((options: unknown) => ({
      driver: "localstorage",
      options
    }))
  };
});

vi.mock("unstorage", () => ({ createStorage: mocks.createStorage }));
vi.mock("unstorage/drivers/indexedb", () => ({
  default: mocks.indexedDbDriver
}));
vi.mock("unstorage/drivers/localstorage", () => ({
  default: mocks.localStorageDriver
}));

import { IndexedDbStorage, LStorage } from "../unstorage";

describe("storage wrappers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("configures IndexedDB and forwards all operations", async () => {
    const storage = new IndexedDbStorage("cache");
    expect(mocks.indexedDbDriver).toHaveBeenCalledWith({ base: "cache" });
    expect(mocks.createStorage).toHaveBeenCalledWith({
      driver: { driver: "indexeddb", options: { base: "cache" } }
    });
    await storage.setItems([{ key: "a", value: 1 }]);
    await storage.getItems(["a"]);
    await storage.setItem("b", { ok: true });
    await storage.getItem("b");
    expect(mocks.client.setItems).toHaveBeenCalledWith([
      { key: "a", value: 1 }
    ]);
    expect(mocks.client.getItems).toHaveBeenCalledWith(["a"]);
    expect(mocks.client.setItem).toHaveBeenCalledWith("b", { ok: true });
    expect(mocks.client.getItem).toHaveBeenCalledWith("b");
  });

  it("configures localStorage and forwards all operations", async () => {
    const storage = new LStorage("session");
    expect(mocks.localStorageDriver).toHaveBeenCalledWith({ base: "session" });
    await storage.setItems([{ key: "a", value: "v", options: { ttl: 50 } }]);
    await storage.getItems([{ key: "a", options: { ttl: 50 } }]);
    await storage.setItem("b", "value");
    await storage.getItem("b");
    expect(mocks.client.setItems).toHaveBeenCalledWith([
      { key: "a", value: "v", options: { ttl: 50 } }
    ]);
    expect(mocks.client.getItems).toHaveBeenCalledWith([
      { key: "a", options: { ttl: 50 } }
    ]);
    expect(mocks.client.setItem).toHaveBeenCalledWith("b", "value");
    expect(mocks.client.getItem).toHaveBeenCalledWith("b");
  });
});
