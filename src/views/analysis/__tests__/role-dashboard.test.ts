import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => ({ query: {} }),
    useRouter: () => ({ replace, push: vi.fn() })
  };
});

vi.mock("@/api", () => ({
  getRoleOverviewApi: vi.fn(),
  getStoreListApi: vi.fn(),
  getRepoListApi: vi.fn()
}));

import DashboardPage from "../dashboard/index.vue";
import { getRepoListApi, getRoleOverviewApi, getStoreListApi } from "@/api";

const RoleDashboardContent = defineComponent({
  name: "RoleDashboardContent",
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  template:
    "<div><div class='role-key'>{{ data?.roleProfile?.key }}</div><div class='section-count'>{{ data?.sections?.length ?? 0 }}</div></div>"
});

describe("Analysis dashboard role overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replace.mockResolvedValue(undefined);
    vi.mocked(getStoreListApi).mockResolvedValue({
      code: 200,
      data: { list: [] }
    } as never);
    vi.mocked(getRepoListApi).mockResolvedValue({
      code: 200,
      data: { list: [] }
    } as never);
    vi.mocked(getRoleOverviewApi).mockResolvedValue({
      code: 200,
      data: {
        roleProfile: {
          key: "executive",
          label: "经营总览",
          description: "聚焦经营异常与关键指标",
          homeTitle: "经营作战台",
          roles: ["boss"]
        },
        filters: {
          startDate: "2026-03-01",
          endDate: "2026-03-24"
        },
        visibleModuleKeys: ["sales", "purchase", "inventory"],
        focusCards: [],
        todoItems: [],
        sections: [
          {
            key: "sales",
            title: "销售分析",
            targetPath: "/analysis/sales",
            summaryCards: [],
            trend: [],
            ranking: [],
            alerts: []
          }
        ]
      }
    } as never);
  });

  it("loads role overview data and renders content component", async () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          ElCard: defineComponent({
            name: "ElCard",
            template: "<div><slot name='header' /><slot /></div>"
          }),
          ElDatePicker: true,
          ElSelect: true,
          ElOption: true,
          RoleDashboardContent
        }
      }
    });

    await flushPromises();

    expect(getStoreListApi).toHaveBeenCalledTimes(1);
    expect(getRepoListApi).toHaveBeenCalledTimes(1);
    expect(getRoleOverviewApi).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".role-key").text()).toBe("executive");
    expect(wrapper.find(".section-count").text()).toBe("1");
  });
});
