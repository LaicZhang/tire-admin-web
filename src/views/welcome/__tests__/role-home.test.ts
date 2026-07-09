import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const getRoutes = vi.fn();

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRouter: () => ({
      push,
      getRoutes
    })
  };
});

vi.mock("@/api", () => ({
  getRoleHomeApi: vi.fn(),
  getNoticeApi: vi.fn()
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    nickname: "张三",
    username: "zhangsan"
  })
}));

vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: () => ({
    companyName: "测试公司",
    storeName: "旗舰店"
  })
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: () => ({
    wholeMenus: [
      {
        path: "/business",
        children: [
          { path: "/business/order", meta: {} },
          { path: "/business/customer", meta: {} },
          { path: "/analysis/sales", meta: {} },
          { path: "/analysis/dashboard", meta: {} },
          { path: "/system/notice", meta: {} }
        ]
      }
    ]
  })
}));

import Welcome from "../index.vue";
import { getNoticeApi, getRoleHomeApi } from "@/api";

const ElCard = defineComponent({
  name: "ElCard",
  template: "<div class='el-card'><slot name='header' /><slot /></div>"
});

const ElButton = defineComponent({
  name: "ElButton",
  emits: ["click"],
  template: "<button @click=\"$emit('click', $event)\"><slot /></button>"
});

const ElTag = defineComponent({
  name: "ElTag",
  props: {
    type: {
      type: String,
      default: ""
    }
  },
  template: "<span class='el-tag' :data-type='type'><slot /></span>"
});

const ElEmpty = defineComponent({
  name: "ElEmpty",
  props: {
    description: {
      type: String,
      default: ""
    }
  },
  template: "<div class='el-empty'>{{ description }}</div>"
});

describe("Welcome role home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockResolvedValue(undefined);
    getRoutes.mockReturnValue([
      { path: "/business/order", meta: {} },
      { path: "/business/customer", meta: {} },
      { path: "/analysis/sales", meta: {} },
      { path: "/analysis/dashboard", meta: {} },
      { path: "/system/notice", meta: {} },
      { path: "/finance/statement", meta: {} }
    ]);

    vi.mocked(getRoleHomeApi).mockResolvedValue({
      code: 200,
      data: {
        roleProfile: {
          key: "sales",
          label: "销售视图",
          description: "聚焦销售待办",
          homeTitle: "销售作战台",
          roles: ["seller"]
        },
        filters: {
          startDate: "2026-03-01",
          endDate: "2026-03-24"
        },
        visibleModuleKeys: ["sales"],
        focusCards: [
          {
            key: "sales-total-amount",
            title: "销售总额",
            value: "1000.00",
            targetPath: "/analysis/sales"
          }
        ],
        todoItems: [
          {
            key: "sales-unshipped",
            label: "待发货销售单",
            value: "6",
            level: "warning",
            module: "sales",
            targetPath: "/analysis/sales"
          }
        ],
        sections: [
          {
            key: "sales",
            title: "销售分析",
            targetPath: "/analysis/sales",
            summaryCards: [],
            trend: [],
            ranking: [
              {
                id: "customer-1",
                name: "重点客户A",
                rank: 1,
                amount: "5200.00"
              }
            ],
            alerts: []
          }
        ]
      }
    } as never);

    vi.mocked(getNoticeApi).mockResolvedValue({
      code: 200,
      data: [
        {
          uid: "notice-1",
          title: "库存预警升级",
          content: "请今日内核对低库存商品",
          level: 2
        }
      ]
    } as never);
  });

  it("loads workbench data, filters shortcuts, and navigates from todo items", async () => {
    const wrapper = mount(Welcome, {
      global: {
        stubs: {
          ElCard,
          ElButton,
          ElTag,
          ElEmpty,
          IconifyIconOffline: true
        },
        directives: {
          loading: () => undefined
        }
      }
    });

    await flushPromises();

    expect(getRoleHomeApi).toHaveBeenCalledTimes(1);
    expect(getNoticeApi).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".hero-title").text()).toBe("销售作战台");
    expect(wrapper.find(".hero-description").text()).toContain("聚焦销售待办");
    expect(wrapper.text()).toContain("销售订单");
    expect(wrapper.text()).toContain("客户管理");
    expect(wrapper.text()).not.toContain("销售报价");
    expect(wrapper.text()).toContain("库存预警升级");
    expect(wrapper.text()).toContain("待发货销售单");

    await wrapper.find(".todo-item").trigger("click");
    expect(push).toHaveBeenCalledWith("/analysis/sales");
  });
});
