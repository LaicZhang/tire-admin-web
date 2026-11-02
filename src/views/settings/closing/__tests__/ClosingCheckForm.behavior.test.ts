import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  checks: vi.fn(),
  execute: vi.fn(),
  confirm: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn()
}));

vi.mock("@/api/setting", () => ({
  runClosingChecksApi: mocks.checks,
  executeClosingApi: mocks.execute
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));

import ClosingCheckForm from "../ClosingCheckForm.vue";

async function mountPage(
  options: {
    isClosing?: boolean;
    date?: string;
    onSuccess?: () => void;
    onClose?: () => void;
  } = {}
) {
  const wrapper = await mountSmokeComponent(
    async () => ({ default: ClosingCheckForm }),
    "settings/closing/ClosingCheckForm.vue",
    {
      keepMounted: true,
      deep: true,
      props: {
        isClosing: options.isClosing ?? true,
        initialDate: options.date ?? "2026-01-31",
        onSuccess: options.onSuccess ?? vi.fn(),
        onClose: options.onClose ?? vi.fn()
      }
    }
  );
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checks.mockResolvedValue({
    code: 200,
    data: [
      { id: "id-1", name: "库存", description: "库存检查", passed: true },
      {
        id: "",
        name: "",
        description: "",
        passed: false,
        errorMessage: "差异"
      },
      null,
      "ignored"
    ]
  });
  mocks.execute.mockResolvedValue({ code: 200, msg: "" });
  mocks.confirm.mockResolvedValue(true);
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("closing check form behavior", () => {
  it("validates empty and malformed dates before calling the API", async () => {
    const wrapper = await mountPage({ date: "" });
    const vm = state(wrapper);
    await vm.runCheck();
    expect(mocks.message).toHaveBeenLastCalledWith("请选择结账日期", {
      type: "warning"
    });
    expect(mocks.checks).not.toHaveBeenCalled();

    vm.closingDate = "2026/01/31";
    await vm.runCheck();
    expect(mocks.message).toHaveBeenLastCalledWith("结账日期格式不正确", {
      type: "warning"
    });
    expect(mocks.checks).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it.each([true, false])(
    "runs the %s closing mode and normalizes mixed result envelopes",
    async isClosing => {
      mocks.checks.mockResolvedValueOnce({
        code: 200,
        data: {
          list: [
            { id: 7, name: "单据", description: "检查单据", passed: 1 },
            { passed: false }
          ]
        }
      });
      const wrapper = await mountPage({ isClosing });
      const vm = state(wrapper);
      await vm.runCheck();
      expect(mocks.checks).toHaveBeenCalledWith(
        "2026-01-31",
        isClosing ? "close" : "unclose"
      );
      expect(vm.checkItems).toEqual([
        {
          id: 7,
          name: "单据",
          description: "检查单据",
          passed: true,
          errorMessage: undefined
        },
        {
          id: "2",
          name: "",
          description: "",
          passed: false,
          errorMessage: undefined
        }
      ]);
      expect(vm.checkLoading).toBe(false);
      wrapper.unmount();
    }
  );

  it("handles empty check data and failed envelopes", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.checks.mockResolvedValueOnce({ code: 200 });
    await vm.runCheck();
    expect(vm.checkItems).toEqual([]);

    vm.checkItems = [{ id: "stale", passed: true }];
    mocks.checks.mockResolvedValueOnce({ code: 500, msg: "check failed" });
    await vm.runCheck();
    expect(mocks.message).toHaveBeenLastCalledWith("check failed", {
      type: "error"
    });
    expect(vm.checkItems).toEqual([]);

    mocks.checks.mockResolvedValueOnce({ code: 500 });
    await vm.runCheck();
    expect(mocks.message).toHaveBeenLastCalledWith("运行结账检查失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it.each([
    [new Error("network"), "运行结账检查失败"],
    ["plain failure", "运行结账检查失败"]
  ])("handles check exceptions", async (error, expected) => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.checks.mockRejectedValueOnce(error);
    await vm.runCheck();
    expect(mocks.handleError).toHaveBeenLastCalledWith(error, expected);
    expect(vm.checkItems).toEqual([]);
    expect(vm.checkLoading).toBe(false);
    wrapper.unmount();
  });

  it("guards closing with empty, malformed and failed checks", async () => {
    const wrapper = await mountPage({ date: "" });
    const vm = state(wrapper);
    await vm.doClosing();
    expect(mocks.message).toHaveBeenLastCalledWith("请选择结账日期", {
      type: "warning"
    });

    vm.closingDate = "";
    const unclose = await mountPage({ isClosing: false, date: "" });
    await state(unclose).doClosing();
    expect(mocks.message).toHaveBeenLastCalledWith("反结账日期为空", {
      type: "warning"
    });

    vm.closingDate = "bad";
    await vm.doClosing();
    expect(mocks.message).toHaveBeenLastCalledWith("结账日期格式不正确", {
      type: "warning"
    });

    vm.closingDate = "2026-01-31";
    vm.checkItems = [{ id: "failed", passed: false }];
    await vm.doClosing();
    expect(mocks.message).toHaveBeenLastCalledWith(
      "存在未通过的检查项，请先处理",
      { type: "warning" }
    );
    expect(mocks.confirm).not.toHaveBeenCalled();
    wrapper.unmount();
    unclose.unmount();
  });

  it("cancels confirmation without executing", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.confirm.mockResolvedValueOnce(false);
    await vm.doClosing();
    expect(mocks.confirm).toHaveBeenCalledWith(
      "确定要结账到 2026-01-31 吗？结账后该日期之前的数据将不能修改。",
      "结账确认",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
    expect(mocks.execute).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it.each([true, false])(
    "executes %s mode with the expected reason and success callback",
    async isClosing => {
      const onSuccess = vi.fn();
      const wrapper = await mountPage({ isClosing, onSuccess });
      const vm = state(wrapper);
      mocks.execute.mockResolvedValueOnce({ code: 200, msg: "server success" });
      await vm.doClosing();
      expect(mocks.confirm).toHaveBeenCalledWith(
        isClosing
          ? "确定要结账到 2026-01-31 吗？结账后该日期之前的数据将不能修改。"
          : "确定要反结账 2026-01-31 吗？",
        isClosing ? "结账确认" : "反结账确认",
        expect.any(Object)
      );
      expect(mocks.execute).toHaveBeenCalledWith(
        "2026-01-31",
        isClosing ? "close" : "unclose",
        isClosing ? "结账到 2026-01-31" : "反结账 2026-01-31"
      );
      expect(mocks.message).toHaveBeenLastCalledWith("server success", {
        type: "success"
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(vm.actionLoading).toBe(false);
      wrapper.unmount();
    }
  );

  it.each([true, false])(
    "uses mode-specific success and failure fallback copy",
    async isClosing => {
      const wrapper = await mountPage({ isClosing });
      const vm = state(wrapper);
      mocks.execute.mockResolvedValueOnce({ code: 200 });
      await vm.doClosing();
      expect(mocks.message).toHaveBeenLastCalledWith(
        isClosing ? "结账成功" : "反结账成功",
        { type: "success" }
      );

      mocks.execute.mockResolvedValueOnce({ code: 500 });
      await vm.doClosing();
      expect(mocks.message).toHaveBeenLastCalledWith(
        isClosing ? "结账失败" : "反结账失败",
        { type: "error" }
      );

      mocks.execute.mockRejectedValueOnce(new Error("execute network"));
      await vm.doClosing();
      expect(mocks.handleError).toHaveBeenLastCalledWith(
        expect.any(Error),
        isClosing ? "结账失败" : "反结账失败"
      );
      expect(vm.actionLoading).toBe(false);
      wrapper.unmount();
    }
  );

  it("renders failed checks, toggles button copy and delegates cancel", async () => {
    const onClose = vi.fn();
    const wrapper = await mountPage({ onClose });
    const vm = state(wrapper);
    expect(wrapper.text()).toContain("开始检查");
    await vm.runCheck();
    await flushPromises();
    expect(wrapper.text()).toContain("重新检查");
    expect(wrapper.text()).toContain("检查结果");
    expect(wrapper.text()).toContain("确定结账");
    expect(vm.hasFailedItems).toBe(true);
    const cancel = wrapper
      .findAll("el-button-stub")
      .find(button => button.text() === "取消");
    await cancel?.trigger("click");
    expect(onClose).toHaveBeenCalled();
    wrapper.unmount();
  });
});
