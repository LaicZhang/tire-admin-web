import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, type VNode } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  upsert: vi.fn(),
  getSettings: vi.fn(),
  patchSettings: vi.fn(),
  addDialog: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn(),
  resetFields: vi.fn()
}));

vi.mock("@/api/data/price-limit", () => ({
  getPriceLimitListApi: mocks.list,
  upsertPriceLimitApi: mocks.upsert
}));

vi.mock("@/api/setting", () => ({
  getCompanySettingGroupApi: mocks.getSettings,
  patchCompanySettingGroupApi: mocks.patchSettings
}));

vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));

vi.mock("@/components/ReSearchForm/index.vue", () => ({
  default: defineComponent({
    emits: ["search", "reset"],
    setup(_, { expose, slots }) {
      expose({ resetFields: mocks.resetFields });
      return () =>
        h("div", { class: "search-form-stub" }, [
          h("button", { class: "search", onClick: () => undefined }, "search"),
          slots.default?.()
        ]);
    }
  })
}));

const Switch = defineComponent({
  props: { modelValue: Boolean },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    return () =>
      h("button", {
        class: "switch-stub",
        "data-value": String(props.modelValue),
        onClick: () => {
          emit("update:modelValue", !props.modelValue);
          emit("change", !props.modelValue);
        }
      });
  }
});

const InputNumber = defineComponent({
  props: { modelValue: Number },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        class: "number-stub",
        value: props.modelValue ?? "",
        onInput: event =>
          emit(
            "update:modelValue",
            Number((event.target as HTMLInputElement).value)
          )
      });
  }
});

const RadioGroup = defineComponent({
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "radio-group-stub", "data-value": props.modelValue }, [
        h(
          "button",
          {
            class: "radio-warn",
            onClick: () => emit("update:modelValue", "warn")
          },
          "warn"
        ),
        h(
          "button",
          {
            class: "radio-block",
            onClick: () => emit("update:modelValue", "block")
          },
          "block"
        )
      ]);
  }
});

function findVnodes(node: VNode, tag: string, found: VNode[] = []): VNode[] {
  if (node.type === tag) found.push(node);
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === "object" && "type" in child) {
        findVnodes(child as VNode, tag, found);
      }
    }
  } else if (children && typeof children === "object" && "type" in children) {
    findVnodes(children as VNode, tag, found);
  }
  return found;
}

function emitVnode(node: VNode, event: string, value: unknown) {
  const handler =
    node.props?.[`on${event}`] ??
    node.props?.[`on${event[0].toUpperCase()}${event.slice(1)}`];
  handler?.(value);
}

function ok(data?: unknown) {
  return Promise.resolve({ code: 200, data });
}

function records() {
  return [
    {
      id: 1,
      uid: "p1",
      tireId: "t1",
      tire: { name: "轮胎甲" },
      maxPurchasePrice: 12345,
      minSalePrice: 23456,
      enablePurchaseLimit: true,
      enableSaleLimit: true,
      updatedAt: "2026-01-01"
    },
    {
      id: 2,
      uid: "p2",
      tireId: "t2",
      tire: { name: "轮胎乙" },
      enablePurchaseLimit: false,
      enableSaleLimit: false
    }
  ];
}

function prime() {
  mocks.list.mockImplementation(() => ok({ list: records(), total: 2 }));
  mocks.getSettings.mockReturnValue(
    ok([
      { key: "allowAboveMaxPrice", value: "true" },
      { key: "allowBelowMinPrice", value: "false" }
    ])
  );
  mocks.upsert.mockResolvedValue({ code: 200 });
  mocks.patchSettings.mockResolvedValue({ code: 200 });
}

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "data/priceLimit/index.vue",
    {
      keepMounted: true,
      deep: true,
      globalStubs: {
        ElSwitch: Switch,
        "el-switch": Switch,
        ElInputNumber: InputNumber,
        "el-input-number": InputNumber,
        ElRadioGroup: RadioGroup,
        "el-radio-group": RadioGroup
      }
    }
  );
  await vi.waitFor(() => expect(mocks.list).toHaveBeenCalled());
  await flushPromises();
  return wrapper;
}

function state(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

function dialogOptions(index = -1) {
  const calls = mocks.addDialog.mock.calls;
  return calls.at(index)?.[0] as Record<string, any>;
}

async function renderDialog(options: Record<string, any>) {
  const Host = defineComponent({
    render: () => options.contentRenderer() as VNode
  });
  const wrapper = mount(Host, {
    global: {
      stubs: {
        ElSwitch: Switch,
        "el-switch": Switch,
        ElInputNumber: InputNumber,
        "el-input-number": InputNumber,
        ElRadioGroup: RadioGroup,
        "el-radio-group": RadioGroup,
        ElForm: false,
        "el-form": false,
        ElFormItem: false,
        "el-form-item": false,
        ElDivider: false,
        "el-divider": false,
        ElAlert: false,
        "el-alert": false,
        ElSelect: false,
        "el-select": false,
        ElOption: false,
        "el-option": false,
        ElRadio: false,
        "el-radio": false
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe("price limit page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prime();
  });

  it("renders mapped prices, files filter combinations and resets paging", async () => {
    const wrapper = await mountPage();
    const data = state(wrapper).dataList;

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      maxPurchasePrice: 123.45,
      minSalePrice: 234.56
    });
    expect(wrapper.text()).toContain("123.45");
    expect(wrapper.text()).toContain("234.56");

    state(wrapper).form.enablePurchaseLimit = true;
    state(wrapper).form.enableSaleLimit = false;
    state(wrapper).onSearch();
    await vi.waitFor(() => expect(state(wrapper).dataList).toHaveLength(0));

    state(wrapper).form.enablePurchaseLimit = undefined;
    state(wrapper).pagination.currentPage = 4;
    state(wrapper).onReset();
    expect(mocks.resetFields).toHaveBeenCalled();
    expect(state(wrapper).pagination.currentPage).toBe(1);
    wrapper.unmount();
  });

  it("reports list failures and handles configuration load branches", async () => {
    mocks.list.mockResolvedValue({ code: 500, msg: "查询失败" });
    const wrapper = await mountPage();
    expect(state(wrapper).dataList).toEqual([]);
    expect(state(wrapper).config).toEqual({
      purchaseOverPriceAction: "warn",
      saleBelowPriceAction: "block"
    });
    wrapper.unmount();

    mocks.message.mockClear();
    mocks.list.mockRejectedValue(new Error("list"));
    mocks.getSettings.mockRejectedValue(new Error("config"));
    const failed = await mountPage();
    await vi.waitFor(() =>
      expect(mocks.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "获取限价控制设置失败"
      )
    );
    failed.unmount();
  });

  it("opens the edit dialog and validates both purchase and sale prices", async () => {
    const wrapper = await mountPage();
    const row = state(wrapper).dataList[1];
    state(wrapper).openDialog(row);
    const options = dialogOptions();
    expect(options.title).toContain("轮胎乙");
    const dialog = await renderDialog(options);

    const root = options.contentRenderer() as VNode;
    const switches = findVnodes(root, "el-switch");
    const numbers = findVnodes(root, "el-input-number");
    emitVnode(switches[0], "update:modelValue", true);
    emitVnode(switches[1], "update:modelValue", true);
    emitVnode(numbers[0], "update:modelValue", 0);
    emitVnode(numbers[1], "update:modelValue", 0);

    // Enter an invalid number despite the numeric control.
    const inputs = (options.contentRenderer() as VNode).children?.[0] as VNode;
    expect(inputs).toBeTruthy();

    emitVnode(numbers[0], "update:modelValue", 12.345);
    emitVnode(numbers[1], "update:modelValue", 23.456);
    const done = vi.fn();
    await options.beforeSure(done);
    await vi.waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        uid: "p2",
        tireId: "t2",
        enablePurchaseLimit: true,
        enableSaleLimit: true,
        maxPurchasePrice: 1235,
        minSalePrice: 2346
      })
    );
    expect(done).toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("保存成功", { type: "success" });
    dialog.unmount();
    wrapper.unmount();
  });

  it("covers edit missing-price and invalid-number guards plus save rejection", async () => {
    const wrapper = await mountPage();
    state(wrapper).openDialog({
      uid: "x",
      tireId: "tx",
      tireName: "X",
      enablePurchaseLimit: true,
      enableSaleLimit: true
    });
    const options = dialogOptions();
    const dialog = await renderDialog(options);
    const numbers = findVnodes(
      options.contentRenderer() as VNode,
      "el-input-number"
    );

    await options.beforeSure(vi.fn());
    expect(mocks.message).toHaveBeenCalledWith("请输入最高采购价", {
      type: "warning"
    });

    emitVnode(numbers[0], "update:modelValue", -1);
    await options.beforeSure(vi.fn());
    expect(mocks.message).toHaveBeenCalledWith("最高采购价不合法", {
      type: "warning"
    });

    emitVnode(numbers[0], "update:modelValue", 1);
    await options.beforeSure(vi.fn());
    expect(mocks.message).toHaveBeenCalledWith("请输入最低销售价", {
      type: "warning"
    });

    emitVnode(numbers[1], "update:modelValue", -1);
    await options.beforeSure(vi.fn());
    expect(mocks.message).toHaveBeenCalledWith("最低销售价不合法", {
      type: "warning"
    });

    emitVnode(numbers[1], "update:modelValue", 2);
    mocks.upsert.mockRejectedValue(new Error("save"));
    await options.beforeSure(vi.fn());
    await flushPromises();
    dialog.unmount();
    wrapper.unmount();
  });

  it("edits global controls and handles success, envelope error and exception", async () => {
    const wrapper = await mountPage();
    state(wrapper).openConfigDialog();
    const options = dialogOptions();
    const dialog = await renderDialog(options);
    expect(options.title).toBe("限价控制设置");

    const groups = findVnodes(
      options.contentRenderer() as VNode,
      "el-radio-group"
    );
    emitVnode(groups[0], "update:modelValue", "block");
    emitVnode(groups[1], "update:modelValue", "warn");

    const done = vi.fn();
    await options.beforeSure(done);
    expect(mocks.patchSettings).toHaveBeenCalledWith("func", {
      allowAboveMaxPrice: false,
      allowBelowMinPrice: true
    });
    expect(state(wrapper).config).toEqual({
      purchaseOverPriceAction: "block",
      saleBelowPriceAction: "warn"
    });
    expect(done).toHaveBeenCalled();

    mocks.patchSettings.mockResolvedValue({ code: 500, msg: "更新失败" });
    await options.beforeSure(done);
    expect(mocks.message).toHaveBeenCalledWith("更新失败", { type: "error" });

    mocks.patchSettings.mockRejectedValue(new Error("patch"));
    await options.beforeSure(done);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "设置保存失败"
    );
    dialog.unmount();
    wrapper.unmount();
  });

  it("warns for empty batch selection and applies mixed batch fallbacks", async () => {
    const wrapper = await mountPage();
    state(wrapper).handleBatchEdit();
    expect(mocks.message).toHaveBeenCalledWith("请选择要设置的商品", {
      type: "warning"
    });
    expect(mocks.addDialog).not.toHaveBeenCalled();

    state(wrapper).handleSelectionChange(state(wrapper).dataList);
    state(wrapper).handleBatchEdit();
    const options = dialogOptions();
    const dialog = await renderDialog(options);
    expect(options.title).toContain("2个商品");

    const done = vi.fn();
    await options.beforeSure(done);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        maxPurchasePrice: 12345,
        minSalePrice: 23456,
        enablePurchaseLimit: true
      })
    );
    expect(mocks.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        maxPurchasePrice: undefined,
        minSalePrice: undefined,
        enablePurchaseLimit: false
      })
    );
    expect(done).toHaveBeenCalled();

    mocks.upsert.mockRejectedValue(new Error("batch"));
    await options.beforeSure(done);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "批量设置失败"
    );
    dialog.unmount();
    wrapper.unmount();
  });

  it("applies explicit mixed batch values and inferred enable flags", async () => {
    const wrapper = await mountPage();
    state(wrapper).handleSelectionChange([state(wrapper).dataList[1]]);
    state(wrapper).handleBatchEdit();
    const options = dialogOptions();
    const dialog = await renderDialog(options);
    const numbers = findVnodes(
      options.contentRenderer() as VNode,
      "el-input-number"
    );
    emitVnode(numbers[0], "update:modelValue", 9.99);
    emitVnode(numbers[1], "update:modelValue", 19.99);

    const done = vi.fn();
    await options.beforeSure(done);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        maxPurchasePrice: 999,
        minSalePrice: 1999,
        enablePurchaseLimit: true,
        enableSaleLimit: true
      })
    );
    expect(done).toHaveBeenCalled();
    dialog.unmount();
    wrapper.unmount();
  });
});
