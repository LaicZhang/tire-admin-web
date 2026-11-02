import { flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  applyDefaults: vi.fn(),
  applyHeader: vi.fn(),
  message: vi.fn(),
  loggerError: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  localForage: () => ({ getItem: mocks.getItem }),
  message: mocks.message
}));
vi.mock("@/composables", async importOriginal => ({
  ...(await importOriginal<typeof import("@/composables")>()),
  applyCreateDefaults: mocks.applyDefaults,
  applyLastFormHeaderAsync: mocks.applyHeader
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.loggerError }
}));

const PopconfirmStub = defineComponent({
  setup(_, { slots }) {
    return () => h("span", { class: "popconfirm-stub" }, slots.reference?.());
  }
});

const SelectStub = defineComponent({
  props: ["modelValue", "placeholder", "disabled"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("select", {
        class: "entity-select-stub",
        "data-disabled": String(props.disabled),
        onChange: event =>
          emit("update:modelValue", (event.target as HTMLSelectElement).value)
      });
  }
});

function row(overrides: Record<string, unknown> = {}) {
  return {
    uid: "detail-1",
    tireId: "tire-1",
    count: 2,
    unitPrice: 15,
    total: 30,
    repoId: "repo-1",
    returnReason: "DAMAGED",
    desc: "破损",
    ...overrides
  };
}

function form(overrides: Record<string, unknown> = {}) {
  return {
    uid: "return-1",
    number: "TH-001",
    providerId: "provider-1",
    providerName: "供应商甲",
    paymentId: "",
    returnReason: "DAMAGED",
    repoId: "repo-1",
    count: 2,
    total: 30,
    showTotal: 30,
    refundAmount: 0,
    desc: "说明",
    isApproved: true,
    rejectReason: "",
    details: [row()],
    ...overrides
  };
}

async function mountForm(formTitle = "新增", formInline = form()) {
  return mountSmokeComponent(
    () => import("../form.vue"),
    "purchase/return/form.vue",
    {
      keepMounted: true,
      deep: true,
      props: { formTitle, formInline },
      globalStubs: {
        ProviderSelect: SelectStub,
        PaymentSelect: SelectStub,
        "provider-select": SelectStub,
        "payment-select": SelectStub,
        ElPopconfirm: PopconfirmStub,
        "el-popconfirm": PopconfirmStub
      }
    }
  );
}

type Wrapper = Awaited<ReturnType<typeof mountForm>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getItem.mockImplementation((key: string) =>
    Promise.resolve(
      key === "all_tires"
        ? [{ uid: "tire-1", name: "轮胎甲" }]
        : key === "all_repos"
          ? [{ uid: "repo-1", name: "主仓" }]
          : [{ uid: "manager-1", name: "经理甲" }]
    )
  );
  mocks.applyDefaults.mockResolvedValue({
    inventory: { defaultWarehouseId: "repo-default" }
  });
  mocks.applyHeader.mockImplementation(
    async (target: Record<string, unknown>) => {
      const header = {
        providerId: "provider-last",
        providerName: "上次供应商",
        paymentId: "payment-last",
        repoId: "repo-last"
      };
      Object.assign(target, header);
      return header;
    }
  );
});

describe("purchase return form behavior", () => {
  it("loads base lists and applies default warehouse and last-used header", async () => {
    const formInline = form({
      details: [row({ repoId: "" })],
      providerId: "",
      providerName: "",
      paymentId: ""
    });
    const wrapper = await mountForm("新增", formInline);
    await flushPromises();

    expect(mocks.getItem).toHaveBeenCalledTimes(3);
    expect(state(wrapper).allTireList).toEqual([
      { uid: "tire-1", name: "轮胎甲" }
    ]);
    expect(state(wrapper).allRepoList).toEqual([
      { uid: "repo-1", name: "主仓" }
    ]);
    expect(state(wrapper).managerList).toEqual([
      { uid: "manager-1", name: "经理甲" }
    ]);
    await vi.waitFor(() =>
      expect(formInline).toMatchObject({
        providerId: "provider-last",
        providerName: "上次供应商",
        paymentId: "payment-last"
      })
    );
    expect(formInline.details[0].repoId).toBe("repo-last");
    expect(state(wrapper).defaultWarehouseId).toBe("repo-last");
    wrapper.unmount();
  });

  it("keeps existing header values when last-used prefill returns no data", async () => {
    mocks.applyHeader.mockResolvedValueOnce(null);
    const formInline = form();
    const wrapper = await mountForm("新增", formInline);
    await flushPromises();
    expect(formInline.providerId).toBe("provider-1");
    expect(formInline.paymentId).toBe("");
    wrapper.unmount();
  });

  it("normalizes missing local storage and last-header fields", async () => {
    mocks.getItem.mockResolvedValue(null);
    mocks.applyDefaults.mockResolvedValueOnce({ inventory: {} });
    mocks.applyHeader.mockResolvedValueOnce({
      providerId: 1,
      providerName: null,
      paymentId: "",
      repoId: ""
    });
    const wrapper = await mountForm();
    await flushPromises();
    expect(state(wrapper).allTireList).toEqual([]);
    expect(state(wrapper).allRepoList).toEqual([]);
    expect(state(wrapper).managerList).toEqual([]);
    expect(state(wrapper).defaultWarehouseId).toBeUndefined();
    wrapper.unmount();
  });

  it("reports base-data and prefill failures without leaving rejected work", async () => {
    mocks.getItem.mockRejectedValueOnce(new Error("storage"));
    mocks.applyDefaults.mockRejectedValueOnce(new Error("defaults"));
    mocks.applyHeader.mockRejectedValueOnce(new Error("header"));
    const wrapper = await mountForm();
    await flushPromises();

    expect(mocks.message).toHaveBeenCalledWith("加载基础数据失败", {
      type: "error"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[CreateDefaults] load failed",
      expect.any(Error)
    );
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[LastForm] purchaseReturn prefill failed",
      expect.any(Error)
    );
    wrapper.unmount();
  });

  it("does not apply create-only defaults for non-create forms", async () => {
    const wrapper = await mountForm("修改");
    await flushPromises();
    expect(mocks.applyDefaults).not.toHaveBeenCalled();
    expect(mocks.applyHeader).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("adds rows with the default warehouse and deletes counted rows while recalculating totals", async () => {
    const formInline = form({
      count: 5,
      total: 80,
      details: [
        row({ count: 2, total: 30 }),
        row({ uid: "detail-2", count: 3, total: 50 })
      ]
    });
    const wrapper = await mountForm("新增", formInline);
    await flushPromises();
    const vm = state(wrapper);

    vm.onAddDetail();
    expect(formInline.details.at(-1)).toMatchObject({
      repoId: "repo-last",
      count: 1,
      total: 0
    });
    const before = formInline.details.length;
    vm.onDeleteDetail(1);
    expect(formInline.details).toHaveLength(before - 1);
    expect(formInline).toMatchObject({ count: 2, total: 30, showTotal: 30 });

    vm.onDeleteDetail(formInline.details.length - 1);
    expect(formInline.details).toHaveLength(before - 2);
    expect(formInline).toMatchObject({ count: 1, total: 30, showTotal: 30 });
    wrapper.unmount();
  });

  it("recalculates detail, order count and amount with numeric fallbacks", async () => {
    const formInline = form({
      count: 2,
      total: 30,
      showTotal: 30,
      details: [
        row(),
        row({ uid: "detail-2", count: 0, unitPrice: 0, total: 0 })
      ]
    });
    const wrapper = await mountForm("修改", formInline);
    await flushPromises();
    const vm = state(wrapper);

    vm.calcDetailTotal(formInline.details[0]);
    expect(formInline.details[0].total).toBe(30);
    formInline.details[1].count = undefined;
    formInline.details[1].unitPrice = undefined;
    formInline.details[1].total = undefined;
    vm.recalcOrderTotal();
    expect(formInline).toMatchObject({ count: 2, total: 30, showTotal: 30 });
    wrapper.unmount();
  });

  it("renders editable detail controls and invokes add from the append row", async () => {
    const wrapper = await mountForm("修改");
    await flushPromises();
    const append = wrapper
      .findAll("el-button-stub")
      .find(item => item.text() === "添加退货明细");
    expect(append).toBeDefined();
    const before = state(wrapper).formData.details.length;
    await append!.trigger("click");
    expect(state(wrapper).formData.details).toHaveLength(before + 1);
    expect(
      wrapper.findAll("el-button-stub").filter(item => item.text() === "删除")
    ).toHaveLength(before + 1);
    wrapper.unmount();
  });

  it.each(["查看", "审核"])(
    "hides editable controls in %s mode",
    async formTitle => {
      const wrapper = await mountForm(formTitle);
      await flushPromises();
      expect(
        wrapper
          .findAll("el-button-stub")
          .some(item => item.text() === "添加退货明细")
      ).toBe(false);
      expect(
        wrapper.findAll("el-button-stub").some(item => item.text() === "删除")
      ).toBe(false);
      wrapper.unmount();
    }
  );

  it("renders audit details and rejection reason only when rejected", async () => {
    const formInline = form({ isApproved: false, rejectReason: "数量不符" });
    const wrapper = await mountForm("审核", formInline);
    await flushPromises();
    expect(wrapper.text()).toContain("审核信息");
    expect(
      wrapper
        .findAll("el-form-item-stub")
        .some(item => item.attributes("label") === "拒绝原因")
    ).toBe(true);

    state(wrapper).formData.isApproved = true;
    await flushPromises();
    expect(
      wrapper
        .findAll("el-form-item-stub")
        .some(item => item.attributes("label") === "拒绝原因")
    ).toBe(false);
    wrapper.unmount();
  });

  it("renders the refund section and requires a nonblank payment account", async () => {
    const wrapper = await mountForm("退款", form({ paymentId: "" }));
    await flushPromises();
    const vm = state(wrapper);
    expect(wrapper.text()).toContain("退款信息");
    expect(
      wrapper
        .findAll("el-form-item-stub")
        .some(item => item.attributes("label") === "退款账户")
    ).toBe(true);

    const validator = vm.formRules.paymentId[0].validator;
    const success = vi.fn();
    const failure = vi.fn();
    validator({}, "", failure);
    validator({}, "   ", failure);
    validator({}, "payment-1", success);
    expect(failure).toHaveBeenCalledTimes(2);
    expect(failure).toHaveBeenCalledWith(expect.any(Error));
    expect(success).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("does not require a payment account outside refund mode", async () => {
    const wrapper = await mountForm("新增");
    await flushPromises();
    const validator = state(wrapper).formRules.paymentId[0].validator;
    const callback = vi.fn();
    validator({}, "", callback);
    expect(callback).toHaveBeenCalledWith();
    wrapper.unmount();
  });

  it("replaces form data when the formInline prop changes", async () => {
    const wrapper = await mountForm("修改");
    await flushPromises();
    const replacement = form({ number: "TH-002", details: [] });
    await wrapper.setProps({ formInline: replacement });
    await flushPromises();
    expect(state(wrapper).formData.number).toBe("TH-002");
    expect(state(wrapper).formData.details).toEqual([]);
    wrapper.unmount();
  });
});
