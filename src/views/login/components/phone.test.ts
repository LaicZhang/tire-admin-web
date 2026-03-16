import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import Phone from "./phone.vue";
import { completeLogin } from "@/services";
import { message } from "@/utils/message";

const mocks = vi.hoisted(() => ({
  loginByUsername: vi.fn(),
  setCurrentPage: vi.fn(),
  getVerifyCodeApi: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/services", () => ({
  completeLogin: vi.fn()
}));

vi.mock("@/api", () => ({
  getVerifyCodeApi: (...args: unknown[]) => mocks.getVerifyCodeApi(...args)
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    loginByUsername: mocks.loginByUsername,
    setCurrentPage: mocks.setCurrentPage,
    isRemember: false
  }))
}));

vi.mock("../utils/captchaCode", () => ({
  useCaptchaCode: () => ({
    isDisabled: { value: false },
    text: { value: "" },
    start: vi.fn(),
    end: vi.fn()
  })
}));

vi.mock("../utils/motion", () => ({
  default: {
    template: "<div><slot /></div>"
  }
}));

const ElFormStub = defineComponent({
  name: "ElForm",
  setup(_, { slots, expose }) {
    expose({
      validate: vi.fn().mockResolvedValue(true)
    });
    return () => h("form", slots.default?.());
  }
});

const ElButtonStub = defineComponent({
  name: "ElButton",
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          onClick: () => emit("click")
        },
        slots.default?.()
      );
  }
});

describe("phone login", () => {
  let wrapper: VueWrapper | undefined;

  beforeEach(() => {
    mocks.loginByUsername.mockReset();
    mocks.setCurrentPage.mockReset();
    mocks.getVerifyCodeApi.mockReset();
    vi.mocked(completeLogin).mockReset();
    vi.mocked(message).mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
  });

  function mountView() {
    wrapper = mount(Phone, {
      global: {
        stubs: {
          "el-form": ElFormStub,
          "el-form-item": { template: "<div><slot /></div>" },
          "el-input": true,
          "el-button": ElButtonStub
        }
      }
    });
    return wrapper;
  }

  it("passes store isRemember into loginByUsername", async () => {
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
});
