/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Login from "./index.vue";
import { useRouter } from "vue-router";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";

// Hoisted mocks for reactivity
const mocks = vi.hoisted(() => {
  return {
    handleGithubLogin: vi.fn(),
    useLoginForm: {
      loading: { value: false },
      githubLoading: { value: false },
      disabled: { value: false },
      ruleForm: {
        username: "",
        password: "",
        captchaCode: "",
        isRemember: false
      }
    }
  };
});

// Mocks
vi.mock("vue-router", () => ({
  useRouter: vi.fn()
}));

vi.mock("@/utils/auth", async importOriginal => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    setToken: vi.fn()
  };
});

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/router/utils", () => ({
  addPathMatch: vi.fn()
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

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: vi.fn(() => ({ handleWholeMenus: vi.fn() }))
}));

vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: vi.fn(() => ({
    companyId: "test-id",
    handleCurrentCompany: vi.fn()
  }))
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    currentPage: 0,
    setCurrentPage: vi.fn(),
    loginByUsername: vi.fn().mockResolvedValue({ code: 200, data: {} }),
    isRemember: false,
    loginDay: 7
  }))
}));

vi.mock("./composables/useLoginForm", async () => {
  const { ref, reactive } = await import("vue");
  return {
    useCaptcha: () => ({
      captchaUrl: ref("test-url"),
      refreshCaptcha: vi.fn()
    }),
    useRememberLogin: () => ({ checked: ref(false), loginDay: ref(7) }),
    useLoginForm: () => ({
      loading: ref(mocks.useLoginForm.loading.value),
      githubLoading: ref(mocks.useLoginForm.githubLoading.value),
      disabled: ref(mocks.useLoginForm.disabled.value),
      ruleForm: reactive(mocks.useLoginForm.ruleForm),
      handleGithubLogin: mocks.handleGithubLogin
    })
  };
});

vi.mock("./utils/motion", () => ({
  default: {
    template: "<div><slot /></div>"
  }
}));

const commonStubs = {
  IconifyIconOnline: {
    template: '<span class="iconify-stub" :data-icon="icon"></span>',
    props: ["icon"]
  },
  IconifyIconOffline: true,
  "el-switch": true,
  "el-form": { template: "<form><slot /></form>" },
  "el-form-item": { template: "<div><slot /></div>" },
  "el-input": true,
  "el-checkbox": true,
  "el-button": {
    name: "ElButton",
    template: '<button :disabled="disabled"><slot /></button>',
    props: ["disabled", "loading"]
  },
  "el-divider": true,
  "el-tooltip": {
    template:
      '<div class="el-tooltip-stub" :content="content" :disabled="disabled"><slot /></div>',
    props: ["content", "disabled"]
  },
  avatar: true,
  phone: true,
  qrCode: true,
  register: true,
  forget: true
};

describe("Login.vue", () => {
  let wrapper: VueWrapper;
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock
    } as any);

    mocks.handleGithubLogin.mockReset();
    mocks.useLoginForm.githubLoading.value = false;
    mocks.useLoginForm.loading.value = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders GitHub login button with correct structure", () => {
    wrapper = mount(Login, {
      global: {
        stubs: commonStubs,
        directives: {
          loading: (el, binding) => {
            el.setAttribute("data-loading", String(binding.value));
          }
        }
      }
    });

    // Verify Tooltip
    const tooltip = wrapper.find(".el-tooltip-stub");
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.attributes("content")).toBe("仅限管理员登录");

    // Verify GitHub Button
    const githubBtn = wrapper.find(".github-btn");
    expect(githubBtn.exists()).toBe(true);
    expect(githubBtn.attributes("title")).toBe("GitHub");
  });

  it("reflects loading state correctly", async () => {
    // Set loading state
    mocks.useLoginForm.githubLoading.value = true;

    wrapper = mount(Login, {
      global: {
        stubs: commonStubs,
        directives: {
          loading: (el, binding) => {
            el.setAttribute("data-loading", String(binding.value));
          }
        }
      }
    });

    // Check loading directive on root
    expect(wrapper.attributes("data-loading")).toBe("true");

    // Check login button disabled
    const buttons = wrapper.findAllComponents({ name: "ElButton" });
    const loginBtn = buttons.find(btn => btn.text() === "登录");
    expect(loginBtn).toBeDefined();
    expect(loginBtn?.props("disabled")).toBe(true);

    // Check tooltip disabled
    const tooltip = wrapper.find(".el-tooltip-stub");
    expect(tooltip.attributes("disabled")).toBe("true");

    // Check github button class
    const githubBtn = wrapper.find(".github-btn");
    expect(githubBtn.classes()).toContain("is-disabled");
  });

  it("calls handleGithubLogin on click", async () => {
    mocks.handleGithubLogin.mockResolvedValue({ accessToken: "fake-token" });

    wrapper = mount(Login, {
      global: {
        stubs: commonStubs,
        directives: {
          loading: () => {}
        }
      }
    });

    const githubBtn = wrapper.find(".github-btn");
    expect(githubBtn.exists()).toBe(true);
    await githubBtn.trigger("click");

    expect(mocks.handleGithubLogin).toHaveBeenCalled();
  });
});
