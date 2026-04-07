import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getInvoicePage: vi.fn(),
  issueInvoice: vi.fn(),
  redFlushInvoice: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  handleApiError: vi.fn(),
  routeState: {
    path: "/finance/invoice",
    query: {}
  }
}));

vi.mock("@/api/business/invoice", () => ({
  getInvoicePage: mocks.getInvoicePage,
  issueInvoice: mocks.issueInvoice,
  redFlushInvoice: mocks.redFlushInvoice
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => mocks.routeState,
    useRouter: () => ({
      push: mocks.push,
      replace: mocks.replace
    })
  };
});

vi.mock("@/utils/error", () => ({
  handleApiError: mocks.handleApiError
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

vi.mock("./InvoiceFormDialog.vue", () => ({
  default: {
    name: "InvoiceFormDialogStub",
    props: ["modelValue", "preset"],
    emits: ["update:modelValue", "success"],
    template: `
      <div data-test="invoice-form-dialog">
        {{ modelValue ? "open" : "closed" }}:{{ preset?.businessType || "" }}:{{ preset?.deliveryNoteId || "" }}:{{ preset?.purchaseInboundId || "" }}
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
        :key="row.uid"
        class="table-row"
        :data-row-uid="row.uid"
      >
        <span class="invoice-number">{{ row.invoiceNumber }}</span>
        <slot name="operation" :row="row" />
      </div>
    </div>
  `
});

function mountPage() {
  return mount(Index, {
    global: {
      components: {
        PureTableBar: {
          props: ["title", "columns"],
          template: `
            <div>
              <slot name="buttons" />
              <slot :size="'default'" :dynamicColumns="columns" />
            </div>
          `
        },
        "pure-table": PureTableStub
      },
      stubs: {
        ElFormItem: {
          template: "<div><slot /></div>"
        },
        ElInput: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template:
            "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value || undefined)\" />"
        },
        ElSelect: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template:
            "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value || undefined)\" />"
        },
        ElOption: {
          template: "<span />"
        },
        ElButton: ElButtonStub
      }
    }
  });
}

describe("business/finance/invoice/index", () => {
  beforeEach(() => {
    mocks.getInvoicePage.mockReset();
    mocks.issueInvoice.mockReset();
    mocks.redFlushInvoice.mockReset();
    mocks.push.mockReset();
    mocks.replace.mockReset();
    mocks.handleApiError.mockReset();
    mocks.routeState.query = {};
    mocks.getInvoicePage.mockResolvedValue({
      data: {
        total: 1,
        list: [
          {
            uid: "invoice-1",
            invoiceNumber: "INV-001",
            invoiceRole: "BLUE",
            redFlushStatus: "NONE",
            businessType: "SALE",
            partyName: "客户甲",
            statementNo: "RS-001",
            status: "draft",
            totalAmount: 11300,
            invoiceDate: "2026-03-25T00:00:00.000Z"
          }
        ]
      }
    });
    mocks.issueInvoice.mockResolvedValue({ data: null });
  });

  it("应加载发票列表并支持筛选", async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mocks.getInvoicePage).toHaveBeenCalledWith(1, {
      businessType: undefined,
      status: undefined,
      invoiceNumber: undefined
    });
    expect(wrapper.text()).toContain("INV-001");

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("SALE");
    await inputs[1].setValue("draft");
    await inputs[2].setValue("INV");
    await wrapper.get("[data-test='search']").trigger("click");
    await flushPromises();

    expect(mocks.getInvoicePage).toHaveBeenLastCalledWith(1, {
      businessType: "SALE",
      status: "draft",
      invoiceNumber: "INV"
    });
  });

  it("应打开新建弹窗并跳转详情", async () => {
    const wrapper = mountPage();

    await flushPromises();

    const detailButton = wrapper
      .findAll("[data-row-uid='invoice-1'] button")
      .find(button => button.text() === "查看");
    expect(detailButton).toBeDefined();
    await detailButton!.trigger("click");

    expect(mocks.push).toHaveBeenCalledWith(
      "/finance/invoice/detail/invoice-1"
    );

    const createButton = wrapper
      .findAll("button")
      .find(button => button.text() === "新建发票");
    expect(createButton).toBeDefined();
    await createButton!.trigger("click");
    await flushPromises();

    expect(wrapper.get("[data-test='invoice-form-dialog']").text()).toContain(
      "open"
    );
  });

  it("应对已签发蓝票展示红冲按钮并调用接口", async () => {
    mocks.getInvoicePage.mockResolvedValueOnce({
      data: {
        total: 1,
        list: [
          {
            uid: "invoice-issued-1",
            invoiceNumber: "INV-ISSUED-001",
            invoiceRole: "BLUE",
            redFlushStatus: "NONE",
            businessType: "SALE",
            partyName: "客户甲",
            statementNo: "RS-002",
            status: "issued",
            amount: 10000,
            taxAmount: 1300,
            totalAmount: 11300,
            invoiceDate: "2026-03-25T00:00:00.000Z"
          }
        ]
      }
    });
    mocks.redFlushInvoice.mockResolvedValue({ data: null });

    const wrapper = mountPage();

    await flushPromises();

    const redFlushButton = wrapper
      .findAll("[data-row-uid='invoice-issued-1'] button")
      .find(button => button.text() === "红冲");

    expect(redFlushButton).toBeDefined();
    await redFlushButton!.trigger("click");
    await flushPromises();

    expect(mocks.redFlushInvoice).toHaveBeenCalledWith("invoice-issued-1", {
      invoiceNumber: "INV-ISSUED-001-R",
      invoiceType: "vat_normal",
      invoiceDate: expect.any(String),
      amount: 10000,
      taxAmount: 1300,
      totalAmount: 11300,
      redFlushReason: "后台红冲"
    });
  });

  it("应根据 autoCreate 路由参数打开带预设值的新建弹窗并清空查询参数", async () => {
    mocks.routeState.query = {
      autoCreate: "1",
      deliveryNoteId: "delivery-1",
      businessType: "PURCHASE"
    };

    const wrapper = mountPage();

    await flushPromises();

    expect(wrapper.get("[data-test='invoice-form-dialog']").text()).toContain(
      "open:PURCHASE:delivery-1:"
    );
    expect(mocks.replace).toHaveBeenCalledWith({
      path: "/finance/invoice",
      query: {}
    });
  });

  it("不应对非蓝票或已全额红冲发票展示红冲按钮", async () => {
    mocks.getInvoicePage.mockResolvedValueOnce({
      data: {
        total: 2,
        list: [
          {
            uid: "invoice-full-red-1",
            invoiceNumber: "INV-FULL-001",
            invoiceRole: "BLUE",
            redFlushStatus: "FULL",
            businessType: "SALE",
            partyName: "客户甲",
            statementNo: "RS-003",
            status: "issued",
            totalAmount: 11300,
            invoiceDate: "2026-03-25T00:00:00.000Z"
          },
          {
            uid: "invoice-red-role-1",
            invoiceNumber: "INV-RED-001",
            invoiceRole: "RED",
            redFlushStatus: "NONE",
            businessType: "SALE",
            partyName: "客户乙",
            statementNo: "RS-004",
            status: "issued",
            totalAmount: 8800,
            invoiceDate: "2026-03-25T00:00:00.000Z"
          }
        ]
      }
    });

    const wrapper = mountPage();

    await flushPromises();

    expect(
      wrapper
        .findAll("[data-row-uid='invoice-full-red-1'] button")
        .some(button => button.text() === "红冲")
    ).toBe(false);
    expect(
      wrapper
        .findAll("[data-row-uid='invoice-red-role-1'] button")
        .some(button => button.text() === "红冲")
    ).toBe(false);
    expect(mocks.redFlushInvoice).not.toHaveBeenCalled();
  });
});
