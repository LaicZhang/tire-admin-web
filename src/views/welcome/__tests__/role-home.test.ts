import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({
  getRoleHomeApi: vi.fn()
}));

import Welcome from "../index.vue";
import { getRoleHomeApi } from "@/api";

const RoleDashboardContent = defineComponent({
  name: "RoleDashboardContent",
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  template: `
    <div>
      <div class="home-title">{{ data?.roleProfile?.homeTitle }}</div>
      <div class="focus-count">{{ data?.focusCards?.length ?? 0 }}</div>
    </div>
  `
});

describe("Welcome role home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          { key: "sales-total-amount", title: "销售总额", value: "1000.00" }
        ],
        todoItems: [],
        sections: []
      }
    } as never);
  });

  it("loads role home data and passes it into content component", async () => {
    const wrapper = mount(Welcome, {
      global: {
        stubs: {
          RoleDashboardContent
        }
      }
    });

    await flushPromises();

    expect(getRoleHomeApi).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".home-title").text()).toBe("销售作战台");
    expect(wrapper.find(".focus-count").text()).toBe("1");
  });
});
