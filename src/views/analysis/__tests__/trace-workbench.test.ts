import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => ({
      query: {
        startDate: "2026-04-01",
        endDate: "2026-04-07",
        keyword: "trace"
      }
    }),
    useRouter: () => ({ replace, push })
  };
});

vi.mock("@/api", () => ({
  getTraceWorkbenchListApi: vi.fn(),
  getTraceWorkbenchDetailApi: vi.fn(),
  getStoreListApi: vi.fn(),
  getRepoListApi: vi.fn()
}));

vi.mock("@/composables/useDialogService", () => ({
  addDialog: vi.fn()
}));

vi.mock("@/utils", () => ({
  handleApiError: vi.fn()
}));

import TraceWorkbenchPage from "../traceWorkbench/index.vue";
import {
  getRepoListApi,
  getStoreListApi,
  getTraceWorkbenchDetailApi,
  getTraceWorkbenchListApi
} from "@/api";

const ElButton = defineComponent({
  name: "ElButton",
  inheritAttrs: true,
  emits: ["click"],
  template:
    '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
});

const ElCard = defineComponent({
  name: "ElCard",
  template: "<div><slot name='header' /><slot /></div>"
});

const ElPagination = defineComponent({
  name: "ElPagination",
  template: "<div />"
});

describe("TraceWorkbenchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replace.mockResolvedValue(undefined);
    push.mockResolvedValue(undefined);
    vi.mocked(getStoreListApi).mockResolvedValue({
      code: 200,
      data: { list: [] }
    } as never);
    vi.mocked(getRepoListApi).mockResolvedValue({
      code: 200,
      data: { list: [] }
    } as never);
    vi.mocked(getTraceWorkbenchListApi).mockResolvedValue({
      code: 200,
      data: {
        summary: {
          openIncidentCount: 3,
          highRiskCount: 1,
          rollbackRecommendedCount: 1,
          resolvedTodayCount: 0
        },
        list: [
          {
            incidentId: "inc-1",
            title: "库存负数异常",
            module: "inventory",
            incidentType: "inventoryAnomaly",
            severity: "danger",
            status: "open",
            occurredAt: "2026-04-03 10:00:00",
            operatorName: "张三",
            traceId: "trace-1",
            summary: "扣减后库存为负数"
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20
      }
    } as never);
    vi.mocked(getTraceWorkbenchDetailApi).mockResolvedValue({
      code: 200,
      data: {
        incident: {
          incidentId: "inc-1",
          title: "库存负数异常",
          module: "inventory",
          incidentType: "inventoryAnomaly",
          severity: "danger",
          status: "open",
          occurredAt: "2026-04-03 10:00:00",
          operatorName: "张三",
          traceId: "trace-1",
          summary: "扣减后库存为负数",
          reasonHint: "出库链路存在重复扣减"
        },
        documents: [],
        timeline: [],
        impact: {
          affectedOrderCount: 1,
          affectedSkuCount: 2
        },
        actions: {
          canPreviewRollback: true,
          canExecuteRollback: true,
          canOpenLogDetail: true
        }
      }
    } as never);
  });

  it("loads incidents, auto-selects the first item, and opens system log with traceId", async () => {
    const wrapper = mount(TraceWorkbenchPage, {
      global: {
        directives: {
          loading: () => undefined
        },
        stubs: {
          ElButton,
          ElCard,
          ElPagination,
          ElDatePicker: true,
          ElSelect: true,
          ElOption: true,
          ElInput: true,
          ElTag: true,
          ElEmpty: true,
          ElDescriptions: true,
          ElDescriptionsItem: true,
          ElDivider: true,
          ElScrollbar: true,
          ElSkeleton: true
        }
      }
    });

    await flushPromises();

    expect(getTraceWorkbenchListApi).toHaveBeenCalledWith(1, {
      startDate: "2026-04-01",
      endDate: "2026-04-07",
      storeId: undefined,
      repoId: undefined,
      module: undefined,
      incidentType: undefined,
      status: undefined,
      keyword: "trace"
    });
    expect(getTraceWorkbenchDetailApi).toHaveBeenCalledWith("inc-1");

    await wrapper.get('[data-test="open-log"]').trigger("click");

    expect(push).toHaveBeenCalledWith({
      path: "/system/log",
      query: { traceId: "trace-1" }
    });
  });
});
