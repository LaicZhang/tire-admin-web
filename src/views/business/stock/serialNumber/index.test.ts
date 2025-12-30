import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Index from "./index.vue";

// Mock APIs
vi.mock("@/api/business/serialNumber", () => ({
  getSerialNumberList: vi
    .fn()
    .mockResolvedValue({ data: { list: [], count: 0 } }),
  getSerialNumberLogs: vi.fn(),
  createSerialNumber: vi.fn(),
  createSerialNumberBatch: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

const PureTableBar = {
  template: "<div><slot name='buttons'></slot><slot :size='size'></slot></div>",
  data() {
    return { size: "default" };
  }
};

const PureTable = {
  name: "PureTable",
  props: ["columns", "data"],
  template: "<div></div>"
};

describe("Serial Number List", () => {
  it("renders correctly", () => {
    const wrapper = mount(Index, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElButton: true,
          ElDialog: true,
          ElTag: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
