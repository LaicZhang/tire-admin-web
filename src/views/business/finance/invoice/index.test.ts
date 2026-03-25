import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getInvoicePage: vi.fn(),
  push: vi.fn()
}));

vi.mock("@/api/business/invoice", () => ({
  getInvoicePage: mocks.getInvoicePage
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => ({
      path: "/finance/invoice",
      query: {}
    }),
    useRouter: () => ({
      push: mocks.push,
      replace: vi.fn()
    })
  };
});

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
    props: ["modelValue"],
    emits: ["update:modelValue", "success"],
    template: `
      <div data-test="invoice-form-dialog">
        {{ modelValue ? "open" : "closed" }}
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
    mocks.push.mockReset();
    mocks.getInvoicePage.mockResolvedValue({
      data: {
        total: 1,
        list: [
          {
            uid: "invoice-1",
            invoiceNumber: "INV-001",
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
});
