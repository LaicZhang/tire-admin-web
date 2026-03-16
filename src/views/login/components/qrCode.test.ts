import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import QrCode from "./qrCode.vue";
import { completeLogin } from "@/services";
import { getWxQrLoginUrlApi, wxQrCallbackApi } from "@/api/auth";
import { message } from "@/utils";

const mocks = vi.hoisted(() => ({
  setCurrentPage: vi.fn()
}));

vi.mock("@/api/auth", () => ({
  getWxQrLoginUrlApi: vi.fn(),
  wxQrCallbackApi: vi.fn()
}));

vi.mock("@/services", () => ({
  completeLogin: vi.fn()
}));

vi.mock("@/utils", async () => {
  const actual = await vi.importActual<object>("@/utils");
  return {
    ...actual,
    message: vi.fn(),
    authLogger: {
      error: vi.fn()
    }
  };
});

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    setCurrentPage: mocks.setCurrentPage,
    isRemember: false
  }))
}));

vi.mock("../utils/motion", () => ({
  default: defineComponent({
    name: "MotionStub",
    setup(_, { slots }) {
      return () => h("div", slots.default?.());
    }
  })
}));

vi.mock("@/components/ReQrcode", () => ({
  default: defineComponent({
    name: "ReQrcodeStub",
    props: {
      text: { type: String, required: true }
    },
    setup(props) {
      return () => h("div", { "data-testid": "qrcode" }, props.text);
    }
  })
}));

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

describe("qrCode login", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getWxQrLoginUrlApi).mockReset();
    vi.mocked(wxQrCallbackApi).mockReset();
    vi.mocked(completeLogin).mockReset();
    vi.mocked(message).mockReset();
    mocks.setCurrentPage.mockReset();
    window.history.replaceState({}, "", "/login");
  });

  it("loads QR login URL on mount", async () => {
    vi.mocked(getWxQrLoginUrlApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: {
        authUrl: "https://wx.example/qr",
        state: "state-1",
        expiresIn: 60
      }
    });

    const wrapper = mount(QrCode, {
      global: {
        stubs: {
          "el-divider": true,
          "el-icon": true,
          "el-button": ElButtonStub
        }
      }
    });

    await flushPromises();

    expect(getWxQrLoginUrlApi).toHaveBeenCalledTimes(1);
    expect(wrapper.get("[data-testid='qrcode']").text()).toBe(
      "https://wx.example/qr"
    );
  });

  it("completes login when callback params exist in the URL", async () => {
    vi.mocked(getWxQrLoginUrlApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: {
        authUrl: "https://wx.example/qr",
        state: "state-1",
        expiresIn: 60
      }
    });
    vi.mocked(wxQrCallbackApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: {
        accessToken: "token",
        refreshToken: "refresh-token",
        username: "alice",
        roles: ["admin"],
        expires: new Date("2026-03-10T00:00:00.000Z")
      }
    });
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    window.history.replaceState({}, "", "/login?code=wx-code&state=wx-state");

    mount(QrCode, {
      global: {
        stubs: {
          "el-divider": true,
          "el-icon": true,
          "el-button": ElButtonStub
        }
      }
    });

    await flushPromises();

    expect(wxQrCallbackApi).toHaveBeenCalledWith({
      code: "wx-code",
      state: "wx-state",
      isRemember: false
    });
    expect(completeLogin).toHaveBeenCalledWith({
      accessToken: "token",
      refreshToken: "refresh-token",
      username: "alice",
      roles: ["admin"],
      expires: new Date("2026-03-10T00:00:00.000Z")
    });
    expect(replaceStateSpy).toHaveBeenCalledWith({}, "", "/login");
    expect(message).toHaveBeenCalledWith("登录成功", { type: "success" });
  });

  it("marks QR code as expired and refreshes it on click", async () => {
    vi.mocked(getWxQrLoginUrlApi)
      .mockResolvedValueOnce({
        code: 200,
        msg: "",
        data: {
          authUrl: "https://wx.example/qr-1",
          state: "state-1",
          expiresIn: 11
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        msg: "",
        data: {
          authUrl: "https://wx.example/qr-2",
          state: "state-2",
          expiresIn: 60
        }
      });

    const wrapper = mount(QrCode, {
      global: {
        stubs: {
          "el-divider": true,
          "el-icon": true,
          "el-button": ElButtonStub
        }
      }
    });

    await flushPromises();
    vi.advanceTimersByTime(1000);
    await flushPromises();

    expect(wrapper.text()).toContain("二维码已过期");

    await wrapper.find(".cursor-pointer").trigger("click");
    await flushPromises();

    expect(getWxQrLoginUrlApi).toHaveBeenCalledTimes(2);
    expect(wrapper.get("[data-testid='qrcode']").text()).toBe(
      "https://wx.example/qr-2"
    );
  });
});
