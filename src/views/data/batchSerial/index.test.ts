import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// Mock router to avoid execution of router/index.ts which has side effects
vi.mock("@/router", () => ({
  constantRoutes: [],
  useRouter: () => ({ push: vi.fn() })
}));

import Index from "./index.vue";

// Mock APIs
vi.mock("@/api/business/serialNumber", () => ({
  getSerialNumberList: vi.fn(),
  createSerialNumber: vi.fn(),
  createSerialNumberBatch: vi.fn()
}));

vi.mock("@/api/batch", () => ({
  getBatchListApi: vi.fn(),
  createBatchApi: vi.fn()
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

vi.mock("@/components/ReDialog", () => ({
  addDialog: vi.fn()
}));

vi.mock("@pureadmin/utils", () => ({
  withInstall: (comp: unknown) => comp,
  cloneDeep: (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown,
  isBoolean: (value: unknown) => typeof value === "boolean",
  isFunction: (value: unknown) => typeof value === "function",
  getKeyList: (arr: unknown, key: string) =>
    Array.isArray(arr)
      ? arr.map(item => (item as Record<string, unknown>)[key])
      : [],
  deviceDetection: () => false,
  storageLocal: () => ({
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  })
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

describe("Batch Serial", () => {
  it("renders correctly", () => {
    const wrapper = mount(Index, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElCard: { template: "<div><slot /></div>" },
          ElAlert: true,
          ElTabs: { template: "<div><slot /></div>" },
          ElTabPane: { template: "<div><slot /></div>" },
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElButton: true,
          ElEmpty: true,
          ElTag: true,
          ElPopconfirm: true
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
