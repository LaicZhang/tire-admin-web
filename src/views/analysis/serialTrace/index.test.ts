import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSerialTraceApi: vi.fn(),
  getSerialRelatedApi: vi.fn(),
  getSerialProductSummaryApi: vi.fn(),
  handleApiError: vi.fn(),
  replace: vi.fn(),
  route: {
    query: {} as Record<string, string | undefined>
  }
}));

vi.mock("@/api/analysis", () => ({
  getSerialTraceApi: mocks.getSerialTraceApi,
  getSerialRelatedApi: mocks.getSerialRelatedApi,
  getSerialProductSummaryApi: mocks.getSerialProductSummaryApi
}));

vi.mock("@/utils", () => ({
  handleApiError: mocks.handleApiError
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => mocks.route,
    useRouter: () => ({
      replace: mocks.replace
    })
  };
});

import Index from "./index.vue";

function buildTraceResponse(serialNo: string) {
  return {
    code: 200,
    data: {
      summary: {
        serialNo,
        status: "INSTALLED",
        repoId: "repo-1",
        sourceType: "PURCHASE",
        sourceOrderId: "po-1",
        targetType: "SALE",
        targetOrderId: "sale-1"
      },
      logs: [
        {
          action: "IN",
          orderType: "PURCHASE",
          orderId: "po-1",
          createdAt: "2026-04-01T08:00:00.000Z"
        }
      ],
      claims: []
    }
  };
}

function buildRelatedResponse() {
  return {
    code: 200,
    data: {
      relationType: "batch" as const,
      items: [
        {
          serialNo: "SN-002",
          tireName: "测试轮胎",
          repoName: "主仓",
          status: "IN_STOCK"
        }
      ]
    }
  };
}

function buildProductResponse() {
  return {
    code: 200,
    data: {
      product: {
        tireId: "tire-1",
        tireName: "测试轮胎",
        tireFormat: "315/80R22.5",
        tirePattern: "A1"
      },
      inventory: {
        totalSerialCount: 4,
        inStockCount: 1,
        reservedCount: 1,
        inTransitCount: 0,
        afterSalesCount: 1,
        terminalCount: 1
      },
      statusDistribution: [{ status: "IN_STOCK", count: 1 }],
      recentMovements: [
        {
          serialNo: "SN-002",
          action: "IN",
          orderType: "PURCHASE",
          orderId: "po-1",
          createdAt: "2026-04-01T08:00:00.000Z"
        }
      ]
    }
  };
}

function mountPage() {
  return mount(Index, {
    global: {
      stubs: {
        ElButton: {
          props: ["loading", "type", "link"],
          emits: ["click"],
          template:
            "<button type='button' @click=\"$emit('click')\"><slot /></button>"
        },
        ElInput: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template:
            "<input data-test='serial-search-input' :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />"
        },
        ElTag: {
          template: "<span><slot /></span>"
        },
        ElEmpty: {
          template: "<div><slot />空</div>"
        },
        ElSkeleton: {
          template: "<div><slot /></div>"
        },
        ElSkeletonItem: true,
        ElAlert: {
          props: ["title"],
          template: "<div>{{ title }}</div>"
        }
      }
    }
  });
}

describe("analysis/serialTrace/index", () => {
  beforeEach(() => {
    mocks.route.query = { serialNo: "SN-001" };
    mocks.replace.mockReset();
    mocks.handleApiError.mockReset();
    mocks.getSerialTraceApi.mockReset();
    mocks.getSerialRelatedApi.mockReset();
    mocks.getSerialProductSummaryApi.mockReset();
    mocks.getSerialTraceApi.mockResolvedValue(buildTraceResponse("SN-001"));
    mocks.getSerialRelatedApi.mockResolvedValue(buildRelatedResponse());
    mocks.getSerialProductSummaryApi.mockResolvedValue(buildProductResponse());
  });

  it("auto loads trace data from route query", async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mocks.getSerialTraceApi).toHaveBeenCalledWith("SN-001");
    expect(mocks.getSerialRelatedApi).toHaveBeenCalledWith("SN-001");
    expect(mocks.getSerialProductSummaryApi).toHaveBeenCalledWith("SN-001");
    expect(wrapper.text()).toContain("SN-001");
    expect(wrapper.text()).toContain("测试轮胎");
    expect(wrapper.text()).toContain("SN-002");
  });

  it("surfaces main trace failure through the shared error handler", async () => {
    const error = new Error("trace failed");
    mocks.getSerialTraceApi.mockRejectedValue(error);

    mountPage();
    await flushPromises();

    expect(mocks.handleApiError).toHaveBeenCalledWith(
      error,
      "加载轮胎全链路溯源失败"
    );
    expect(mocks.getSerialRelatedApi).not.toHaveBeenCalled();
    expect(mocks.getSerialProductSummaryApi).not.toHaveBeenCalled();
  });

  it("keeps same-product analysis visible when related serials fail", async () => {
    mocks.getSerialRelatedApi.mockRejectedValue(new Error("related failed"));

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("关联序列号加载失败");
    expect(wrapper.text()).toContain("总序列号");
    expect(wrapper.text()).toContain("4");
  });

  it("keeps related serials visible when same-product analysis fails", async () => {
    mocks.getSerialProductSummaryApi.mockRejectedValue(
      new Error("product failed")
    );

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("同商品分析加载失败");
    expect(wrapper.text()).toContain("SN-002");
    expect(wrapper.text()).toContain("主仓");
  });
});
