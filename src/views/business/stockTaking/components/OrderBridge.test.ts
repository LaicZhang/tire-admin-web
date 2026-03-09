import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderBridge from "./OrderBridge.vue";
import { openDialog } from "@/views/business/order/table";
import { message } from "@/utils/message";
import { ORDER_TYPE } from "@/utils/const";

const mocks = vi.hoisted(() => {
  const storageState = new Map<string, unknown>();
  return {
    replace: vi.fn(),
    openDialog: vi.fn(),
    message: vi.fn(),
    storageState,
    storage: {
      getItem: vi.fn((key: string) =>
        Promise.resolve((storageState.get(key) as string | null) ?? null)
      ),
      setItem: vi.fn((key: string, value: unknown) => {
        storageState.set(key, value);
        return Promise.resolve(value);
      }),
      removeItem: vi.fn((key: string) => {
        storageState.delete(key);
        return Promise.resolve();
      })
    }
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({
    replace: mocks.replace
  })
}));

vi.mock("@/views/business/order/table", () => ({
  openDialog: mocks.openDialog
}));

vi.mock("@/utils/message", () => ({
  message: mocks.message
}));

vi.mock("@/utils/const", () => ({
  CUR_FORM_TITLE: "curFormTitle",
  CUR_ORDER_TYPE: "curOrderType",
  ORDER_TYPE: {
    surplus: "surplus-order",
    waste: "waste-order"
  }
}));

vi.mock("@/utils/localforage", () => ({
  localForage: () => mocks.storage
}));

describe("OrderBridge", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.openDialog.mockReset();
    mocks.message.mockReset();
    mocks.storage.getItem.mockClear();
    mocks.storage.setItem.mockClear();
    mocks.storage.removeItem.mockClear();
    mocks.storageState.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("opens a surplus order dialog from stock taking payload and restores local state on close", async () => {
    mocks.storageState.set("curOrderType", "sale-order");
    mocks.storageState.set("curFormTitle", "修改");
    sessionStorage.setItem(
      "stockTakingSurplus",
      JSON.stringify([
        {
          repoId: "repo-1",
          tireId: "tire-1",
          count: 2,
          desc: "盘盈"
        }
      ])
    );

    mount(OrderBridge, {
      props: {
        orderType: ORDER_TYPE.surplus
      }
    });
    await flushPromises();

    expect(openDialog).toHaveBeenCalledWith(
      "新增",
      "surplus-order",
      {
        count: 2,
        total: 0,
        showTotal: 0,
        paidAmount: 0,
        details: [
          {
            repoId: "repo-1",
            tireId: "tire-1",
            count: 2,
            desc: "盘盈"
          }
        ]
      },
      expect.objectContaining({
        closeCallBack: expect.any(Function)
      })
    );
    expect(sessionStorage.getItem("stockTakingSurplus")).toBeNull();

    const closeOptions = vi.mocked(openDialog).mock.calls[0]?.[3];
    await closeOptions?.closeCallBack?.({
      options: {} as never,
      index: 0,
      args: { command: "sure" }
    });
    await flushPromises();

    expect(mocks.storage.setItem).toHaveBeenCalledWith(
      "curOrderType",
      "sale-order"
    );
    expect(mocks.storage.setItem).toHaveBeenCalledWith("curFormTitle", "修改");
    expect(mocks.replace).toHaveBeenCalledWith("/business/stockTaking");
  });

  it("rejects invalid stock taking payload and routes back", async () => {
    sessionStorage.setItem("stockTakingWaste", '{"bad":true}');

    mount(OrderBridge, {
      props: {
        orderType: ORDER_TYPE.waste
      }
    });
    await flushPromises();

    expect(openDialog).not.toHaveBeenCalled();
    expect(message).toHaveBeenCalledWith(
      "盘点结果已失效，请返回盘点页面重新生成",
      {
        type: "error"
      }
    );
    expect(mocks.replace).toHaveBeenCalledWith("/business/stockTaking");
    expect(sessionStorage.getItem("stockTakingWaste")).toBeNull();
  });
});
