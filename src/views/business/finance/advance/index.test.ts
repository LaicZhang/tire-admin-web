import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdvancePaymentList: vi.fn(),
  deleteAdvancePayment: vi.fn(),
  approveAdvancePayment: vi.fn(),
  confirm: vi.fn(),
  handleApiError: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/api/business/advance-payment", () => ({
  getAdvancePaymentList: mocks.getAdvancePaymentList,
  deleteAdvancePayment: mocks.deleteAdvancePayment,
  approveAdvancePayment: mocks.approveAdvancePayment
}));

vi.mock("@/composables/useOptions", () => ({
  useOptions: () => ({
    customers: {
      value: [{ uid: "cust-1", name: "客户甲" }]
    },
    providers: {
      value: [{ uid: "prov-1", name: "供应商乙" }]
    }
  })
}));

vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: mocks.confirm
  })
}));

vi.mock("@/utils", () => ({
  handleApiError: mocks.handleApiError,
  message: mocks.message
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

vi.mock("@/components/ReSearchForm/index.vue", () => ({
  default: {
    name: "ReSearchFormStub",
    props: ["form", "loading"],
    emits: ["search", "reset"],
    template: `
      <div>
        <slot />
        <button type="button" data-test="search" @click="$emit('search')">搜索</button>
        <button type="button" data-test="reset" @click="$emit('reset')">重置</button>
      </div>
    `
  }
}));

vi.mock("@/components/RePureTableBar", () => ({
  PureTableBar: {
    name: "PureTableBarStub",
    props: ["title", "columns"],
    template: `
      <div>
        <slot name="buttons" />
        <slot :size="'default'" :dynamicColumns="columns" />
      </div>
    `
  }
}));

vi.mock("@/components/StatusTag/index.vue", () => ({
  default: {
    name: "StatusTagStub",
    props: ["status"],
    template: "<span class='status-tag'>{{ status }}</span>"
  }
}));

vi.mock("./AdvancePaymentFormDialog.vue", () => ({
  default: {
    name: "AdvancePaymentFormDialogStub",
    props: ["modelValue", "initialType"],
    emits: ["update:modelValue", "success"],
    template: `
      <div data-test="advance-dialog">
        {{ modelValue ? "open" : "closed" }}:{{ initialType || "ALL" }}
      </div>
    `
  }
}));

import Index from "./index.vue";

const ElButtonStub = defineComponent({
  name: "ElButtonStub",
  emits: ["click"],
  setup(_props, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          onClick: () => emit("click")
        },
        slots.default?.()
      );
  }
});

const ElSelectStub = defineComponent({
  name: "ElSelectStub",
  props: {
    modelValue: {
      type: String,
      default: undefined
    },
    placeholder: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    return () =>
      h("div", [
        h("input", {
          placeholder: props.placeholder,
          value: props.modelValue ?? "",
          onInput: event => {
            const value = (event.target as HTMLInputElement).value;
            emit("update:modelValue", value || undefined);
          }
        }),
        slots.default?.()
      ]);
  }
});

const PureTableStub = defineComponent({
  name: "PureTableStub",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  template: `
    <div class="pure-table">
      <div
        v-for="row in data"
        :key="row.id"
        class="table-row"
        :data-row-id="row.id"
      >
        <span class="target-name">{{ row.targetName }}</span>
        <slot name="operation" :row="row" />
        <slot name="status" :row="row" />
      </div>
    </div>
  `
});

function mountPage() {
  return mount(Index, {
    global: {
      components: {
        "pure-table": PureTableStub
      },
      stubs: {
        ElAlert: {
          props: ["title"],
          template: "<div class='el-alert'>{{ title }}</div>"
        },
        ElFormItem: {
          template: "<div><slot /></div>"
        },
        ElSelect: ElSelectStub,
        ElOption: {
          template: "<span />"
        },
        ElButton: ElButtonStub
      }
    }
  });
}

describe("business/finance/advance/index", () => {
  beforeEach(() => {
    mocks.getAdvancePaymentList.mockReset();
    mocks.deleteAdvancePayment.mockReset();
    mocks.approveAdvancePayment.mockReset();
    mocks.confirm.mockReset();
    mocks.handleApiError.mockReset();
    mocks.message.mockReset();

    mocks.getAdvancePaymentList.mockResolvedValue({
      code: 200,
      msg: "success",
      data: {
        list: [
          {
            id: 1,
            uid: "adv-rec-1",
            billNo: "AR-001",
            type: "RECEIPT",
            targetId: "cust-1",
            targetName: "",
            amount: "10000",
            remainingAmount: "2000",
            paymentMethod: "",
            remark: "",
            createTime: "2026-03-19T08:00:00.000Z",
            status: "ACTIVE"
          },
          {
            id: 2,
            uid: "pay-1",
            billNo: "PO-001",
            type: "PAYMENT",
            targetId: "prov-1",
            targetName: "",
            amount: "8000",
            remainingAmount: "3000",
            paymentMethod: "BANK_TRANSFER",
            remark: "",
            createTime: "2026-03-18T08:00:00.000Z",
            status: "DRAFT"
          }
        ],
        total: 2,
        count: 2
      }
    });
    mocks.confirm.mockResolvedValue(true);
    mocks.deleteAdvancePayment.mockResolvedValue(undefined);
    mocks.approveAdvancePayment.mockResolvedValue(undefined);
  });

  it("应加载列表并补齐往来单位名称", async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mocks.getAdvancePaymentList).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      type: undefined,
      targetName: undefined
    });
    expect(wrapper.text()).toContain("客户甲");
    expect(wrapper.text()).toContain("供应商乙");

    const typeInput = wrapper.get("input[placeholder='请选择类型']");
    await typeInput.setValue("PAYMENT");
    const createButton = wrapper
      .findAll("button")
      .find(button => button.text() === "新建");
    expect(createButton).toBeDefined();
    await createButton!.trigger("click");
    await flushPromises();

    expect(wrapper.get("[data-test='advance-dialog']").text()).toContain(
      "open:PAYMENT"
    );
  });

  it("应触发删除和审核动作", async () => {
    const wrapper = mountPage();

    await flushPromises();

    const receiptButtons = wrapper.findAll("[data-row-id='1'] button");
    const receiptDeleteButton = receiptButtons.find(
      button => button.text() === "删除"
    );
    expect(receiptDeleteButton).toBeDefined();
    await receiptDeleteButton!.trigger("click");
    await flushPromises();

    expect(mocks.confirm).toHaveBeenCalledWith(
      "确定删除单据 AR-001 吗？",
      "删除确认",
      { type: "warning" }
    );
    expect(mocks.deleteAdvancePayment).toHaveBeenCalledWith(
      "1",
      "RECEIPT",
      "adv-rec-1"
    );

    const paymentButtons = wrapper.findAll("[data-row-id='2'] button");
    const approveButton = paymentButtons.find(
      button => button.text() === "审核"
    );
    expect(approveButton).toBeDefined();
    await approveButton!.trigger("click");
    await flushPromises();

    expect(mocks.confirm).toHaveBeenCalledWith(
      "确定审核单据 PO-001 吗？审核后会扣减对应账户余额。",
      "审核确认",
      { type: "warning" }
    );
    expect(mocks.approveAdvancePayment).toHaveBeenCalledWith(
      "2",
      "PAYMENT",
      "pay-1"
    );
  });
});
