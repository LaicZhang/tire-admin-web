// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import ReSearchForm from "./index.vue";
import { ElCard, ElForm, ElFormItem, ElButton } from "element-plus";

// Mock icons
vi.mock("~icons/ep/search", () => ({ default: "IconSearch" }));
vi.mock("~icons/ep/refresh", () => ({ default: "IconRefresh" }));

// Mock hook
vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: (icon: any) => icon
}));

describe("ReSearchForm", () => {
  it("renders correctly with default props", () => {
    const wrapper = mount(ReSearchForm, {
      global: {
        components: { ElCard, ElForm, ElFormItem, ElButton }
      }
    });
    expect(wrapper.findComponent(ElCard).exists()).toBe(true);
    expect(wrapper.findComponent(ElForm).exists()).toBe(true);
    // Check for default buttons
    const buttons = wrapper.findAllComponents(ElButton);
    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain("搜索");
    expect(buttons[1].text()).toContain("重置");
  });

  it("emits search event when search button is clicked", async () => {
    const wrapper = mount(ReSearchForm, {
      global: {
        components: { ElCard, ElForm, ElFormItem, ElButton }
      }
    });
    const buttons = wrapper.findAllComponents(ElButton);
    await buttons[0].trigger("click");
    expect(wrapper.emitted("search")).toBeTruthy();
  });

  it("emits reset event when reset button is clicked", async () => {
    const wrapper = mount(ReSearchForm, {
      global: {
        components: { ElCard, ElForm, ElFormItem, ElButton }
      }
    });
    const buttons = wrapper.findAllComponents(ElButton);
    await buttons[1].trigger("click");
    expect(wrapper.emitted("reset")).toBeTruthy();
  });

  it("renders slot content", () => {
    const wrapper = mount(ReSearchForm, {
      global: {
        components: { ElCard, ElForm, ElFormItem, ElButton }
      },
      slots: {
        default: '<div class="test-content">Test Content</div>'
      }
    });
    expect(wrapper.find(".test-content").exists()).toBe(true);
  });

  it("overrides actions slot", () => {
    const wrapper = mount(ReSearchForm, {
      global: {
        components: { ElCard, ElForm, ElFormItem, ElButton }
      },
      slots: {
        actions: '<button class="custom-action">Custom Action</button>'
      }
    });
    expect(wrapper.find(".custom-action").exists()).toBe(true);
    // Default buttons should be gone
    expect(wrapper.text()).not.toContain("搜索");
  });
});
