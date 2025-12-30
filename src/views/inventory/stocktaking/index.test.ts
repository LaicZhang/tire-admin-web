import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Index from "./index.vue";

// Mock APIs
vi.mock("@/api/business/inventory-check", () => ({
  getInventoryCheckTasksApi: vi
    .fn()
    .mockResolvedValue({ data: { list: [], count: 0 }, code: 200 }),
  getInventoryCheckTaskApi: vi.fn(),
  createInventoryCheckTaskApi: vi.fn(),
  updateInventoryCheckDetailsApi: vi.fn(),
  completeInventoryCheckTaskApi: vi.fn(),
  cancelInventoryCheckTaskApi: vi.fn(),
  deleteInventoryCheckTaskApi: vi.fn()
}));

vi.mock("@/api/company/repo", () => ({
  getRepoListApi: vi.fn().mockResolvedValue({ data: { list: [] }, code: 200 })
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

vi.mock("@/components/ReDialog", () => ({
  addDialog: vi.fn()
}));

vi.mock("@pureadmin/utils", () => ({
  deviceDetection: () => false,
  storageLocal: () => ({
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  }),
  withInstall: <T>(c: T): T => c,
  cloneDeep: (o: unknown) => JSON.parse(JSON.stringify(o)),
  isBoolean: (v: unknown) => typeof v === "boolean"
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

describe("Inventory Stocktaking", () => {
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
          ElDialog: true,
          ElTable: true, // For the dialog table if not fully replaced or for other parts
          ElTableColumn: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
