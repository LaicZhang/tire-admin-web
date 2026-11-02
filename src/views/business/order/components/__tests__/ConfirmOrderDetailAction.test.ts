import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import "../../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  getOrderApi: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/api/business/order", () => ({ getOrderApi: mocks.getOrderApi }));
vi.mock("@/utils/message", () => ({ message: mocks.message }));

import ConfirmOrderDetailAction from "../ConfirmOrderDetailAction.vue";

type Action =
  | "purchase-arrival"
  | "sale-shipment"
  | "sale-delivery"
  | "return-arrival"
  | "return-shipment"
  | "return-delivery"
  | "transfer-shipment"
  | "transfer-arrival";

const FormStub = defineComponent({
  setup(_, { expose, slots }) {
    expose({ validate: vi.fn().mockResolvedValue(true) });
    return () => h("form", slots.default?.());
  }
});

async function mountAction(action: Action = "sale-delivery") {
  const wrapper = mount(ConfirmOrderDetailAction, {
    props: { orderType: "sale", action, orderUid: "order-1" },
    global: { stubs: { ElForm: FormStub } }
  });
  await flushPromises();
  await nextTick();
  return wrapper;
}

function state(wrapper: Awaited<ReturnType<typeof mountAction>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrderApi.mockResolvedValue({ code: 200, data: { details: [] } });
});

describe("ConfirmOrderDetailAction loading", () => {
  it("maps valid details, skips malformed rows and exposes labels", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          null,
          "bad",
          { uid: 1, tireId: "ignored" },
          {
            uid: "detail-1",
            tireId: "tire-1",
            count: 3,
            serialProgress: {
              total: 3,
              shippedCount: 1,
              pendingShipmentSerialNos: ["A", "B"]
            }
          }
        ]
      }
    });
    const wrapper = await mountAction("transfer-arrival");

    expect(mocks.getOrderApi).toHaveBeenCalledWith("sale", "order-1");
    expect(state(wrapper).details).toHaveLength(1);
    expect(state(wrapper).form.detailUid).toBe("detail-1");
    expect(state(wrapper).makeDetailLabel(state(wrapper).details[0])).toBe(
      "detail-1 tire-1 ×3 待处理:0"
    );
    expect(state(wrapper).currentPendingSerialNos).toEqual([]);
    expect(state(wrapper).needsSerialSelection).toBe(true);
    wrapper.unmount();
  });

  it("renders pending arrival serials for transfer arrival", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          {
            uid: "detail-1",
            serialProgress: {
              total: 2,
              shippedCount: 1,
              pendingShipmentSerialNos: ["S1"],
              pendingArrivalSerialNos: ["A1"]
            }
          }
        ]
      }
    });
    const wrapper = await mountAction("transfer-arrival");

    expect(state(wrapper).needsSerialSelection).toBe(true);
    expect(state(wrapper).currentPendingSerialNos).toEqual(["A1"]);
    expect(state(wrapper).makeDetailLabel(state(wrapper).details[0])).toBe(
      "detail-1 待处理:1"
    );
    wrapper.unmount();
  });

  it.each(["sale-shipment", "transfer-shipment"] as Action[])(
    "requires serial selection for %s",
    async action => {
      mocks.getOrderApi.mockResolvedValueOnce({
        code: 200,
        data: {
          details: [
            {
              uid: "detail-1",
              serialProgress: {
                total: 1,
                shippedCount: 0,
                pendingShipmentSerialNos: ["S1"]
              }
            }
          ]
        }
      });
      const wrapper = await mountAction(action);
      const s = state(wrapper);
      expect(s.needsSerialSelection).toBe(true);
      expect(s.currentPendingSerialNos).toEqual(["S1"]);
      s.form.serialNosText = "S1";
      expect(wrapper.vm.getPayload().serialNos).toEqual(["S1"]);
      wrapper.unmount();
    }
  );

  it("does not require serials for other actions or missing progress", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          {
            uid: "detail-1",
            serialProgress: {
              total: 0,
              shippedCount: 0,
              pendingShipmentSerialNos: ["S1"]
            }
          },
          { uid: "detail-2" }
        ]
      }
    });
    const wrapper = await mountAction("return-arrival");
    expect(state(wrapper).needsSerialSelection).toBe(false);
    expect(state(wrapper).currentPendingSerialNos).toEqual(["S1"]);
    expect(state(wrapper).makeDetailLabel({ uid: "detail-2" })).toBe(
      "detail-2"
    );
    wrapper.unmount();
  });

  it("reports non-200, Error and non-Error failures and clears details", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 500,
      msg: "failed",
      data: null
    });
    const first = await mountAction();
    expect(mocks.message).toHaveBeenCalledWith("failed", { type: "error" });
    expect(state(first).details).toEqual([]);
    first.unmount();

    mocks.getOrderApi.mockResolvedValueOnce({ code: 500, data: null });
    const second = await mountAction();
    expect(mocks.message).toHaveBeenCalledWith("加载订单详情失败", {
      type: "error"
    });
    second.unmount();

    mocks.getOrderApi.mockRejectedValueOnce(new Error("network"));
    const third = await mountAction();
    expect(mocks.message).toHaveBeenCalledWith("network", { type: "error" });
    third.unmount();

    mocks.getOrderApi.mockRejectedValueOnce("offline");
    const fourth = await mountAction();
    expect(mocks.message).toHaveBeenCalledWith("加载订单详情失败", {
      type: "error"
    });
    fourth.unmount();
  });

  it("handles a response without a details array and keeps an existing selection", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({ code: 200, data: {} });
    const wrapper = await mountAction();
    expect(state(wrapper).details).toEqual([]);

    state(wrapper).form.detailUid = "kept";
    state(wrapper).details = [{ uid: "other" }];
    await flushPromises();
    expect(state(wrapper).form.detailUid).toBe("kept");
    wrapper.unmount();
  });

  it("sets loading while the request is pending", async () => {
    let resolve!: (value: unknown) => void;
    mocks.getOrderApi.mockReturnValueOnce(
      new Promise(r => {
        resolve = r;
      })
    );
    const wrapper = mount(ConfirmOrderDetailAction, {
      props: { orderType: "sale", action: "sale-delivery", orderUid: "1" },
      global: { stubs: { ElForm: FormStub } }
    });
    expect(state(wrapper).loading).toBe(true);
    resolve({ code: 200, data: { details: [] } });
    await flushPromises();
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();
  });
});

describe("payload and validation", () => {
  it("builds the full trimmed payload", async () => {
    const wrapper = await mountAction("purchase-arrival");
    const s = state(wrapper);
    s.form.detailUid = "detail-1";
    s.form.batchNo = " batch ";
    s.form.productionDate = "2026-01-01";
    s.form.expiryDate = "2026-02-01";

    expect(wrapper.vm.getPayload()).toEqual({
      detailUid: "detail-1",
      shipCount: undefined,
      serialNos: undefined,
      batchNo: "batch",
      productionDate: "2026-01-01",
      expiryDate: "2026-02-01"
    });
    wrapper.unmount();
  });

  it("includes ship count and deduplicated serial numbers when needed", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          {
            uid: "detail-1",
            count: 1,
            serialProgress: {
              total: 2,
              shippedCount: 0,
              pendingShipmentSerialNos: ["A"]
            }
          }
        ]
      }
    });
    const wrapper = await mountAction("sale-shipment");
    const s = state(wrapper);
    s.form.serialNosText = "A\nB\nA";
    expect(wrapper.vm.getPayload()).toEqual({
      detailUid: "detail-1",
      shipCount: undefined,
      serialNos: ["A", "B"],
      batchNo: undefined,
      productionDate: undefined,
      expiryDate: undefined
    });
    wrapper.unmount();
  });

  it("fills sale ship count from detail when non-positive", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          { uid: "detail-1", count: 5 },
          { uid: "detail-2", count: 2 }
        ]
      }
    });
    const wrapper = await mountAction("sale-shipment");
    const s = state(wrapper);
    s.form.shipCount = 0;
    s.form.detailUid = "detail-2";
    await flushPromises();
    expect(s.form.shipCount).toBe(2);
    expect(wrapper.vm.getPayload().shipCount).toBe(2);
    wrapper.unmount();
  });

  it("validates serials before invoking the form validator", async () => {
    mocks.getOrderApi.mockResolvedValueOnce({
      code: 200,
      data: {
        details: [
          {
            uid: "detail-1",
            serialProgress: {
              total: 1,
              shippedCount: 0,
              pendingShipmentSerialNos: ["A"]
            }
          }
        ]
      }
    });
    const wrapper = await mountAction("sale-shipment");
    const initial = state(wrapper);
    initial.form.detailUid = "";
    initial.form.detailUid = "detail-1";
    await nextTick();
    initial.form.serialNosText = "";
    expect(await wrapper.vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("请录入本次确认的胎号", {
      type: "warning"
    });

    const s = state(wrapper);
    s.form.serialNosText = "A";
    s.formRef.validate = vi.fn().mockResolvedValue(true);
    expect(await wrapper.vm.validate()).toBe(true);
    wrapper.unmount();
  });

  it("reports invalid forms, rejected validators and missing refs", async () => {
    const wrapper = await mountAction();
    const s = state(wrapper);

    s.formRef.validate = vi.fn().mockResolvedValue(false);
    expect(await wrapper.vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("请检查表单填写", {
      type: "warning"
    });

    s.formRef.validate = vi.fn().mockRejectedValue(new Error("bad"));
    expect(await wrapper.vm.validate()).toBe(false);

    s.formRef = undefined;
    expect(await wrapper.vm.validate()).toBe(false);
    wrapper.unmount();
  });

  it("validates date and text rules across branches", async () => {
    const wrapper = await mountAction("purchase-arrival");
    const rules = state(wrapper).rules;
    const callback = vi.fn();
    const production = rules.productionDate[0].validator;
    const expiry = rules.expiryDate[0].validator;

    production({}, "", callback);
    expect(callback).toHaveBeenLastCalledWith();
    production({}, "bad", callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));
    production({}, 20260101, callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));

    expiry({}, "", callback);
    expect(callback).toHaveBeenLastCalledWith();
    expiry({}, "bad", callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));

    state(wrapper).form.productionDate = "";
    expiry({}, "2026-02-01", callback);
    expect(callback).toHaveBeenLastCalledWith();

    state(wrapper).form.productionDate = "2026-03-01";
    expiry({}, "2026-02-01", callback);
    expect(callback).toHaveBeenLastCalledWith(expect.any(Error));

    state(wrapper).form.productionDate = "bad";
    expiry({}, "2026-02-01", callback);
    expect(callback).toHaveBeenLastCalledWith();
    wrapper.unmount();
  });
});
