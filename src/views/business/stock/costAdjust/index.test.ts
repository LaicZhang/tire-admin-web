import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// Mock router to avoid execution of router/index.ts which has side effects
vi.mock("@/router", () => ({
  constantRoutes: [],
  useRouter: () => ({ push: vi.fn() })
}));

import Index from "./index.vue";

// Mock APIs
vi.mock("@/api/business/costAdjust", () => ({
  getCostAdjustOrderList: vi.fn().mockResolvedValue({ list: [], count: 0 }),
  approveCostAdjustOrder: vi.fn(),
  rejectCostAdjustOrder: vi.fn(),
  deleteCostAdjustOrder: vi.fn()
}));

vi.mock("@/utils/formatMoney", () => ({
  formatMoney: (val: number) => String(val)
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

describe("Cost Adjust", () => {
  it("renders correctly", () => {
    const wrapper = mount(Index, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElCard: { template: "<div><slot /></div>" },
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElSelect: true,
          ElOption: true,
          ElButton: true,
          ElTag: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
