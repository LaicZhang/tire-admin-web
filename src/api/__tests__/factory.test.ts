const { httpMock } = vi.hoisted(() => ({
  httpMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));
vi.mock("@/utils/http", () => ({ http: httpMock }));

import {
  createCrudApi,
  createReadOnlyApi,
  createSoftDeleteCrudApi
} from "../factory";

beforeEach(() => {
  Object.values(httpMock).forEach(fn => fn.mockClear());
});

describe("API factory", () => {
  it("creates standard CRUD requests with prefixed paths and payloads", () => {
    const api = createCrudApi<
      { name: string },
      { name: string },
      { uid: string },
      { keyword?: string }
    >({
      resource: "customer",
      prefix: "/business/"
    });
    api.list(2, { keyword: "alice" });
    api.create({ name: "Alice" });
    api.get("uid-1");
    api.update("uid-1", { name: "Bob" });
    api.delete("uid-1");

    expect(httpMock.get).toHaveBeenCalledWith("/api/v1/business/customer", {
      params: { page: 2, keyword: "alice" }
    });
    expect(httpMock.post).toHaveBeenCalledWith("/api/v1/business/customer", {
      data: { name: "Alice" }
    });
    expect(httpMock.get).toHaveBeenCalledWith(
      "/api/v1/business/customer/uid-1"
    );
    expect(httpMock.patch).toHaveBeenCalledWith(
      "/api/v1/business/customer/uid-1",
      { data: { name: "Bob" } }
    );
    expect(httpMock.delete).toHaveBeenCalledWith(
      "/api/v1/business/customer/uid-1"
    );
  });

  it("supports list-only APIs without a prefix", () => {
    const api = createReadOnlyApi<{ uid: string }, { status: string }>({
      resource: "audit-log"
    });
    api.list(1, { status: "OK" });
    api.get("log-1");
    expect(httpMock.get).toHaveBeenNthCalledWith(1, "/api/v1/audit-log", {
      params: { page: 1, status: "OK" }
    });
    expect(httpMock.get).toHaveBeenNthCalledWith(2, "/api/v1/audit-log/log-1");
  });

  it("adds soft-delete and restore operations", () => {
    const api = createSoftDeleteCrudApi({
      resource: "fixture",
      prefix: "/system/"
    });
    api.softDelete("uid-1");
    api.restore("uid-1");
    expect(httpMock.patch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/system/fixture/uid-1/soft-delete"
    );
    expect(httpMock.patch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/system/fixture/uid-1/restore"
    );
    expect(api.list).toEqual(expect.any(Function));
    expect(api.create).toEqual(expect.any(Function));
    expect(api.get).toEqual(expect.any(Function));
    expect(api.update).toEqual(expect.any(Function));
    expect(api.delete).toEqual(expect.any(Function));
  });
});
