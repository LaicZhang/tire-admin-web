import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDictItems } from "../useSysDict";

const mocks = vi.hoisted(() => ({
  getItems: vi.fn(),
  getCached: vi.fn(),
  error: vi.fn()
}));

vi.mock("@/api/system/dict", () => ({
  getDictItemsApi: mocks.getItems
}));

vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    localForage: () => ({
      getItem: mocks.getCached,
      setItem: vi.fn(),
      removeItem: vi.fn()
    })
  };
});

vi.mock("@/utils/logger", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils/logger")>();
  return {
    ...actual,
    logger: { ...actual.logger, error: mocks.error }
  };
});

describe("useDictItems automatic loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCached.mockResolvedValue(null);
  });

  it("settles loading and logs when the mounted refresh cannot load a dictionary", async () => {
    mocks.getItems.mockResolvedValue({ code: 500, msg: "字典服务不可用" });

    const Host = defineComponent({
      setup() {
        const { isLoading } = useDictItems("tireGroup");
        return { isLoading };
      },
      template: "<span>{{ isLoading }}</span>"
    });

    const wrapper = mount(Host);
    await flushPromises();

    expect(mocks.error).toHaveBeenCalledWith(
      "自动加载字典失败",
      expect.objectContaining({ message: "字典服务不可用" })
    );
    expect(wrapper.text()).toBe("false");
    wrapper.unmount();
  });
});
