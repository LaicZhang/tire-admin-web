import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h, reactive, ref } from "vue";
import Login from "./index.vue";
import { completeLogin } from "@/services";
import { message } from "@/utils/message";

const mocks = vi.hoisted(() => ({
  loginByUsername: vi.fn(),
  setCurrentPage: vi.fn(),
  useLoginForm: {
    loading: { value: false },
    disabled: { value: false },
    ruleForm: {
      username: "admin",
      password: "123456",
      captchaCode: "abcd",
      isRemember: false
    }
  }
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/services", () => ({
  completeLogin: vi.fn()
}));

vi.mock("@/layout/hooks/useNav", () => ({
  useNav: () => ({ title: "Test Title" })
}));

vi.mock("@/layout/hooks/useLayout", () => ({
  useLayout: () => ({ initStorage: vi.fn() })
}));

vi.mock("@/layout/hooks/useDataThemeChange", () => ({
  useDataThemeChange: () => ({ dataTheme: false, dataThemeChange: vi.fn() })
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    currentPage: 0,
    setCurrentPage: mocks.setCurrentPage,
    loginByUsername: mocks.loginByUsername,
    isRemember: false,
    loginDay: 7
  }))
}));

vi.mock("./composables/useLoginForm", () => ({
  useCaptcha: () => ({
    captchaUrl: ref("test-url"),
    refreshCaptcha: vi.fn()
  }),
  useRememberLogin: () => ({ checked: ref(false), loginDay: ref(7) }),
  useLoginForm: () => ({
    loading: ref(mocks.useLoginForm.loading.value),
    disabled: ref(mocks.useLoginForm.disabled.value),
    ruleForm: reactive(mocks.useLoginForm.ruleForm)
  })
}));

vi.mock("./utils/motion", () => ({
  default: {
    template: "<div><slot /></div>"
  }
}));

const ElFormStub = defineComponent({
  name: "ElForm",
  setup(_, { slots, expose }) {
    expose({
      validate: vi.fn().mockResolvedValue(true),
      resetFields: vi.fn()
    });
    return () => h("form", slots.default?.());
  }
});

const ElButtonStub = defineComponent({
  name: "ElButton",
  props: {
    disabled: Boolean,
    loading: Boolean
  },
  emits: ["click"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          disabled: props.disabled,
          onClick: () => emit("click")
        },
        slots.default?.()
      );
  }
});

const commonStubs = {
  IconifyIconOnline: {
    template: '<span class="iconify-stub" :data-icon="icon"></span>',
    props: ["icon"]
  },
  IconifyIconOffline: true,
  "el-switch": true,
  "el-form": ElFormStub,
  "el-form-item": { template: "<div><slot /></div>" },
  "el-input": true,
  "el-checkbox": true,
  "el-button": ElButtonStub,
  "el-divider": true,
  "el-tooltip": {
    template:
      '<div class="el-tooltip-stub" :content="content" :disabled="disabled"><slot /></div>',
    props: ["content", "disabled"]
  },
  avatar: true,
  phone: true,
  qrCode: true,
  forget: true
};

describe("Login.vue", () => {
  let wrapper: VueWrapper | undefined;

  beforeEach(() => {
    mocks.loginByUsername.mockReset();
    mocks.setCurrentPage.mockReset();
    vi.mocked(completeLogin).mockReset();
    vi.mocked(message).mockReset();
    mocks.useLoginForm.loading.value = false;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
  });

  function mountView() {
    wrapper = mount(Login, {
      global: {
        stubs: commonStubs
      }
    });
    return wrapper;
  }

  it("hides register entry and does not render GitHub login", () => {
    const view = mountView();

    expect(view.text()).not.toContain("注册");
    expect(view.find(".github-btn").exists()).toBe(false);
    expect(view.html()).not.toContain("仅限管理员登录");
  });

  it("uses completeLogin after username login succeeds", async () => {
    mocks.loginByUsername.mockResolvedValue({ code: 200, data: {} });
    const view = mountView();

    const loginButton = view
      .findAll("button")
      .find(button => button.text().includes("登录"));
    expect(loginButton).toBeDefined();

    await loginButton?.trigger("click");

    expect(mocks.loginByUsername).toHaveBeenCalledWith(
      expect.objectContaining({ isRemember: false })
    );
    expect(completeLogin).toHaveBeenCalledWith();
    expect(message).toHaveBeenCalledWith("登录成功", { type: "success" });
  });

  it("shows unavailable message for placeholder third-party login", async () => {
    const view = mountView();
    const wechatIcon = view
      .findAll(".iconify-stub")
      .find(node => node.attributes("data-icon") === "ri:wechat-fill");

    expect(wechatIcon).toBeDefined();
    await wechatIcon!.element.parentElement!.dispatchEvent(new Event("click"));
    // trigger via wrapper click on parent span
    const spans = view
      .findAll("span")
      .filter(s => s.attributes("title") === "微信登录");
    if (spans.length) {
      await spans[0].trigger("click");
    }

    expect(message).toHaveBeenCalledWith("该登录方式暂未开放", {
      type: "warning"
    });
  });
});
