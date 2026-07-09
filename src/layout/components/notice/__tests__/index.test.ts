import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({
  getNoticeApi: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("../noticeList.vue", () => ({
  default: defineComponent({
    name: "NoticeList",
    template: "<div class='notice-list-stub' />"
  })
}));

import Notice from "../index.vue";
import { getNoticeApi } from "@/api";

const ElDropdown = defineComponent({
  name: "ElDropdown",
  template: "<div><slot /><slot name='dropdown' /></div>"
});

const ElDropdownMenu = defineComponent({
  name: "ElDropdownMenu",
  template: "<div><slot /></div>"
});

const ElTabs = defineComponent({
  name: "ElTabs",
  props: {
    modelValue: {
      type: String,
      default: ""
    }
  },
  template: "<div><slot /></div>"
});

const ElTabPane = defineComponent({
  name: "ElTabPane",
  props: {
    label: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    }
  },
  template: "<div class='tab-label'>{{ label }}</div><slot />"
});

const ElBadge = defineComponent({
  name: "ElBadge",
  props: {
    value: {
      type: Number,
      default: 0
    },
    hidden: {
      type: Boolean,
      default: false
    }
  },
  template:
    "<div><span class='badge-value'>{{ hidden ? '' : value }}</span><slot /></div>"
});

const ElScrollbar = defineComponent({
  name: "ElScrollbar",
  template: "<div><slot /></div>"
});

const ElEmpty = defineComponent({
  name: "ElEmpty",
  template: "<div class='empty'>暂无消息</div>"
});

describe("header notice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNoticeApi).mockResolvedValue({
      code: 200,
      data: [
        {
          uid: "notice-1",
          title: "系统公告A",
          content: "请检查今日库存",
          level: 2
        },
        {
          uid: "notice-2",
          title: "系统公告B",
          content: "请核对待审核单据",
          level: 1
        }
      ]
    } as never);
  });

  it("loads notices from api and updates badge count", async () => {
    const wrapper = mount(Notice, {
      global: {
        stubs: {
          ElDropdown,
          ElDropdownMenu,
          ElTabs,
          ElTabPane,
          ElBadge,
          ElScrollbar,
          ElEmpty,
          IconifyIconOffline: true
        }
      }
    });

    await flushPromises();

    expect(getNoticeApi).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".badge-value").text()).toBe("2");
    expect(wrapper.text()).toContain("通知(2)");
  });
});
