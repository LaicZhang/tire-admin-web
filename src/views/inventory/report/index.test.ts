import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import Index from "./index.vue";
import { http } from "@/utils/http";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: vi.fn(() => "icon")
}));

vi.mock("@/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  })),
  logger: {
    error: vi.fn()
  }
}));

const ReSearchFormStub = defineComponent({
  name: "ReSearchForm",
  emits: ["search", "reset"],
  setup(_, { slots }) {
    return () => h("div", { "data-testid": "search-form" }, slots.default?.());
  }
});

const PureTableBarStub = defineComponent({
  name: "PureTableBar",
  emits: ["refresh"],
  setup(_, { slots }) {
    return () =>
      h(
        "div",
        { "data-testid": "table-bar" },
        slots.default?.({ size: "default" })
      );
  }
});

const PureTableStub = defineComponent({
  name: "PureTable",
  props: {
    data: { type: Array, default: () => [] },
    pagination: { type: Object, default: () => ({}) }
  },
  emits: ["page-current-change"],
  setup(props) {
    return () =>
      h("div", { "data-testid": "pure-table" }, JSON.stringify(props.data));
  }
});

const RepoSelectStub = defineComponent({
  name: "RepoSelect",
  props: {
    modelValue: { type: String, default: undefined }
  },
  emits: ["update:modelValue"],
  setup(_, { emit }) {
    return () =>
      h("button", {
        "data-testid": "repo-select",
        onClick: () => emit("update:modelValue", "repo-2")
      });
  }
});

const ElCardStub = defineComponent({
  name: "ElCard",
  setup(_, { slots }) {
    return () => h("div", { "data-testid": "el-card" }, slots.default?.());
  }
});

const ElFormItemStub = defineComponent({
  name: "ElFormItem",
  setup(_, { slots }) {
    return () => h("div", { "data-testid": "el-form-item" }, slots.default?.());
  }
});

const ElRadioGroupStub = defineComponent({
  name: "ElRadioGroup",
  props: {
    modelValue: { type: String, default: "" }
  },
  emits: ["update:modelValue", "change"],
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});

const ElRadioButtonStub = defineComponent({
  name: "ElRadioButton",
  props: {
    value: { type: String, required: true }
  },
  setup(props, { slots }) {
    return () => h("button", { "data-value": props.value }, slots.default?.());
  }
});

describe("InventoryReport", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({
      code: 200,
      data: {
        count: 1,
        list: [{ id: 1, tireId: "tire-1", repoId: "repo-1" }]
      }
    });
  });

  it("loads balance report on mount", async () => {
    mount(Index, {
      global: {
        stubs: {
          ReSearchForm: ReSearchFormStub,
          PureTableBar: PureTableBarStub,
          "pure-table": PureTableStub,
          RepoSelect: RepoSelectStub,
          "el-card": ElCardStub,
          "el-form-item": ElFormItemStub,
          "el-checkbox": true,
          "el-date-picker": true,
          "el-button": true,
          "el-radio-group": ElRadioGroupStub,
          "el-radio-button": ElRadioButtonStub
        }
      }
    });

    await flushPromises();

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/inventory-report/balance/1",
      expect.objectContaining({
        params: expect.objectContaining({
          repoId: undefined
        })
      })
    );
  });

  it("passes repo filter into report queries", async () => {
    const wrapper = mount(Index, {
      global: {
        stubs: {
          ReSearchForm: ReSearchFormStub,
          PureTableBar: PureTableBarStub,
          "pure-table": PureTableStub,
          RepoSelect: RepoSelectStub,
          "el-card": ElCardStub,
          "el-form-item": ElFormItemStub,
          "el-checkbox": true,
          "el-date-picker": true,
          "el-button": true,
          "el-radio-group": ElRadioGroupStub,
          "el-radio-button": ElRadioButtonStub
        }
      }
    });

    await flushPromises();
    vi.mocked(http.request).mockClear();

    await wrapper.get("[data-testid='repo-select']").trigger("click");
    wrapper.findComponent(ReSearchFormStub).vm.$emit("search");
    await flushPromises();

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/inventory-report/balance/1",
      expect.objectContaining({
        params: expect.objectContaining({
          repoId: "repo-2"
        })
      })
    );
  });

  it("switches endpoint when report type changes", async () => {
    const wrapper = mount(Index, {
      global: {
        stubs: {
          ReSearchForm: ReSearchFormStub,
          PureTableBar: PureTableBarStub,
          "pure-table": PureTableStub,
          RepoSelect: RepoSelectStub,
          "el-card": ElCardStub,
          "el-form-item": ElFormItemStub,
          "el-checkbox": true,
          "el-date-picker": true,
          "el-button": true,
          "el-radio-group": ElRadioGroupStub,
          "el-radio-button": ElRadioButtonStub
        }
      }
    });

    await flushPromises();
    vi.mocked(http.request).mockClear();

    wrapper.findComponent(ElRadioGroupStub).vm.$emit("change", "summary");
    await flushPromises();

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/inventory-report/summary/1",
      expect.any(Object)
    );
  });
});
