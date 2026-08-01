import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => ({
      query: {
        traceId: "trace-1"
      }
    })
  };
});

const getOperationLogListApi = vi.fn();

vi.mock("@/api/system/log", () => ({
  getOperationLogListApi: (...args: unknown[]) =>
    getOperationLogListApi(...args)
}));

vi.mock("@/composables/useDialogService", () => ({
  addDialog: vi.fn()
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: vi.fn()
}));

vi.mock("@/utils", () => ({
  handleApiError: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@pureadmin/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual,
    deviceDetection: vi.fn(() => false)
  };
});

import SystemLogPage from "../index.vue";

const ElButton = defineComponent({
  name: "ElButton",
  template: "<button><slot /></button>"
});

const ReSearchForm = defineComponent({
  name: "ReSearchForm",
  template: "<div><slot /></div>"
});

const PureTableBar = defineComponent({
  name: "PureTableBar",
  template: "<div><slot :size='\"default\"' :dynamicColumns='[]' /></div>"
});

describe("SystemLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOperationLogListApi.mockResolvedValue({
      code: 200,
      data: {
        list: [],
        total: 0
      }
    });
  });

  it("reads traceId from route query when loading logs", async () => {
    mount(SystemLogPage, {
      global: {
        stubs: {
          ElButton,
          ReSearchForm,
          PureTableBar,
          "pure-table": true,
          "el-form-item": true,
          "el-input": true,
          "el-select": true,
          "el-option": true,
          "el-date-picker": true
        }
      }
    });

    await flushPromises();

    expect(getOperationLogListApi).toHaveBeenCalledWith(1, {
      module: undefined,
      operator: undefined,
      traceId: "trace-1",
      success: undefined
    });
  });
});
