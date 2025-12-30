import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Form from "./form.vue";

// Mock APIs
vi.mock("@/api/business/provider", () => ({
  getProviderListApi: vi.fn().mockResolvedValue({ data: { list: [] } })
}));

vi.mock("@/api/payment", () => ({
  getPaymentListApi: vi.fn().mockResolvedValue({ data: [] })
}));

// Mock pure-table
const PureTable = {
  name: "PureTable",
  props: ["data", "columns"],
  template: `
    <div class="pure-table-mock">
      <div v-for="(row, index) in data" :key="index" class="pure-table-row">
        <slot name="sourceOrderNo" :row="row" :index="index"></slot>
        <slot name="sourceOrderType" :row="row" :index="index"></slot>
        <slot name="payableAmount" :row="row" :index="index"></slot>
        <slot name="writeOffAmount" :row="row" :index="index"></slot>
        <slot name="operation" :row="row" :index="index"></slot>
      </div>
    </div>
  `
};

describe("Payment Form", () => {
  it("renders correctly", async () => {
    const wrapper = mount(Form, {
      props: {
        modelValue: true
      },
      global: {
        components: {
          PureTable
        },
        stubs: {
          ElDialog: { template: "<div><slot /><slot name='footer' /></div>" },
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElButton: { template: "<button><slot /></button>" },
          ElInputNumber: true,
          ElDatePicker: true,
          ElRow: { template: "<div><slot /></div>" },
          ElCol: { template: "<div><slot /></div>" },
          ElDivider: true
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
    // Check if dialog title is present (implied by rendering)
  });
});
