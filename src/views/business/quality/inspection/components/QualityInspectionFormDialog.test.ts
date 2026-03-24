import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QualityInspectionFormDialog from "./QualityInspectionFormDialog.vue";

vi.mock("@/api/purchase", () => ({
  getPurchaseOrderApi: vi.fn(),
  getPurchaseOrderListApi: vi.fn()
}));

vi.mock("@/utils", () => ({
  message: vi.fn()
}));

import { getPurchaseOrderApi, getPurchaseOrderListApi } from "@/api/purchase";

const ElFormStub = defineComponent({
  name: "ElForm",
  setup(_, { slots, expose }) {
    expose({
      validate: vi.fn().mockResolvedValue(true)
    });
    return () => h("form", slots.default?.());
  }
});

const ElFormItemStub = defineComponent({
  name: "ElFormItem",
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});

const ElInputStub = defineComponent({
  name: "ElInput",
  props: {
    modelValue: { type: [String, Number], default: "" },
    placeholder: { type: String, default: "" },
    type: { type: String, default: "text" }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        "data-placeholder": props.placeholder,
        "data-input-type": props.type,
        value: props.modelValue,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value)
      });
  }
});

const ElInputNumberStub = defineComponent({
  name: "ElInputNumber",
  props: {
    modelValue: { type: Number, default: undefined },
    placeholder: { type: String, default: "" }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        type: "number",
        "data-placeholder": props.placeholder,
        value: props.modelValue,
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value;
          emit("update:modelValue", value ? Number(value) : undefined);
        }
      });
  }
});

const ElSelectStub = defineComponent({
  name: "ElSelect",
  props: {
    modelValue: { type: [String, Number], default: "" },
    placeholder: { type: String, default: "" }
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "select",
        {
          "data-placeholder": props.placeholder,
          value: props.modelValue,
          onChange: (event: Event) => {
            const value = (event.target as HTMLSelectElement).value;
            emit("update:modelValue", value);
            emit("change", value);
          }
        },
        slots.default?.()
      );
  }
});

const ElOptionStub = defineComponent({
  name: "ElOption",
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true }
  },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  }
});

const ElDatePickerStub = defineComponent({
  name: "ElDatePicker",
  props: {
    modelValue: { type: String, default: "" }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        type: "datetime-local",
        value: props.modelValue,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value)
      });
  }
});

function mountForm() {
  return mount(QualityInspectionFormDialog, {
    global: {
      stubs: {
        ElForm: ElFormStub,
        ElFormItem: ElFormItemStub,
        ElInput: ElInputStub,
        ElInputNumber: ElInputNumberStub,
        ElSelect: ElSelectStub,
        ElOption: ElOptionStub,
        ElDatePicker: ElDatePickerStub
      }
    }
  });
}

describe("QualityInspectionFormDialog", () => {
  beforeEach(() => {
    vi.mocked(getPurchaseOrderListApi).mockReset();
    vi.mocked(getPurchaseOrderApi).mockReset();

    vi.mocked(getPurchaseOrderListApi).mockResolvedValue({
      code: 200,
      data: {
        list: [
          {
            uid: "po-1",
            number: "PO-001",
            isApproved: true,
            details: []
          }
        ],
        total: 1
      }
    } as never);

    vi.mocked(getPurchaseOrderApi).mockResolvedValue({
      code: 200,
      data: {
        uid: "po-1",
        details: [
          {
            uid: "detail-1",
            tireName: "轮胎 A",
            count: 8,
            repoName: "一号仓",
            detailId: 101
          }
        ]
      }
    } as never);
  });

  it("loads approved purchase orders and replaces raw ID inputs with selects", async () => {
    const wrapper = mountForm();
    await flushPromises();

    expect(getPurchaseOrderListApi).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        isApproved: true
      })
    );
    expect(
      wrapper.find('[data-placeholder="请输入采购订单 UID"]').exists()
    ).toBe(false);
    expect(wrapper.find('[data-placeholder="请选择采购订单"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-placeholder="请选择采购明细"]').exists()).toBe(
      true
    );
  });

  it("loads order details after selection and outputs purchaseOrderUid with detailId", async () => {
    const wrapper = mountForm();
    await flushPromises();

    await wrapper.get('[data-placeholder="请选择采购订单"]').setValue("po-1");
    await flushPromises();

    expect(getPurchaseOrderApi).toHaveBeenCalledWith("po-1");

    await wrapper.get('[data-placeholder="请选择采购明细"]').setValue("101");
    await flushPromises();

    expect(
      (wrapper.vm as unknown as { getPayload: () => unknown }).getPayload()
    ).toMatchObject({
      purchaseOrderUid: "po-1",
      detailId: 101,
      inspectedQty: 8,
      qualifiedQty: 8,
      unqualifiedQty: 0
    });
  });
});
