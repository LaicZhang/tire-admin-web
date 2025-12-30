// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import WorkflowIndex from "../index.vue";

// Mock API
vi.mock("@/api/system/workflow", () => ({
  getWorkflowListApi: vi.fn().mockResolvedValue({
    data: {
      list: [],
      total: 0
    }
  }),
  createWorkflowApi: vi.fn(),
  updateWorkflowApi: vi.fn(),
  deleteWorkflowApi: vi.fn()
}));

// Mock Components
const PureTable = {
  name: "PureTable",
  template: "<div><slot name='operation' :row='{}'></slot></div>",
  props: ["columns", "pagination", "data"]
};

vi.mock("@/components/RePureTableBar", () => ({
  PureTableBar: {
    name: "PureTableBar",
    template: `<div><slot :size="'default'" :dynamicColumns="columns"></slot></div>`,
    props: ["columns"]
  }
}));

describe("WorkflowIndex", () => {
  it("renders pure-table with correct columns", async () => {
    const wrapper = mount(WorkflowIndex, {
      global: {
        components: {
          PureTable
        },
        stubs: {
          ElCard: true,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElButton: true,
          ElDialog: true,
          ElDivider: true,
          ElTag: true,
          ElRadioGroup: true,
          ElRadio: true
        }
      }
    });

    // Check if PureTable is rendered
    const table = wrapper.findComponent(PureTable);
    expect(table.exists()).toBe(true);

    // Check columns
    const columns = table.props("columns");
    expect(columns).toBeDefined();
    expect(columns.length).toBeGreaterThan(0);
    expect(columns.some((c: { label: string }) => c.label === "流程名称")).toBe(
      true
    );

    // Check pagination
    const pagination = table.props("pagination");
    expect(pagination).toBeDefined();
    expect(pagination.pageSize).toBe(10);
  });
});
