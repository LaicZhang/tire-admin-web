import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import {
  useFormDialog,
  useFormDialogWithPageState,
  useQuickDialog
} from "../useFormDialog";

const { addDialogMock, messageMock, loggerMock } = vi.hoisted(() => ({
  addDialogMock: vi.fn(),
  messageMock: vi.fn(),
  loggerMock: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    critical: vi.fn()
  }
}));

vi.mock("@/composables/useDialogService", () => ({
  addDialog: addDialogMock
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: messageMock
}));
vi.mock("@/utils/logger", () => ({
  createLogger: () => loggerMock,
  logger: loggerMock
}));

const Form = defineComponent({ render: () => h("div") });

function setup(
  options: Parameters<typeof useFormDialog>[0] = { formComponent: Form }
) {
  let api!: ReturnType<typeof useFormDialog>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useFormDialog(options);
        return () => h("div");
      }
    })
  );
  return { api, wrapper };
}

function dialogOptions() {
  return addDialogMock.mock.calls.at(-1)?.[0] as Record<string, any>;
}

describe("useFormDialog", () => {
  beforeEach(() => {
    addDialogMock.mockClear();
    messageMock.mockClear();
    Object.values(loggerMock).forEach(fn => fn.mockClear());
  });

  it("opens create/edit/view dialogs with default and row data", () => {
    const { api, wrapper } = setup({
      formComponent: Form,
      defaultFormData: { name: "默认" }
    });
    api.openDialog("create");
    expect(api.visible.value).toBe(true);
    expect(api.formData.value).toEqual({ name: "默认" });
    expect(dialogOptions()).toMatchObject({
      title: "新增",
      width: "60%",
      hideFooter: false
    });

    api.openDialog("edit", { uid: "u1", name: "客户" });
    expect(api.formData.value).toEqual({ uid: "u1", name: "客户" });
    expect(dialogOptions().title).toBe("编辑");

    api.openDialog("view", { uid: "u1" });
    expect(dialogOptions().hideFooter).toBe(true);
    api.closeDialog();
    expect(api.visible.value).toBe(false);
    expect(api.formData.value).toEqual({ name: "默认" });
    wrapper.unmount();
  });

  it("honours dialog overrides, close callbacks and quick dialog success", async () => {
    const afterClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { api, wrapper } = setup({
      formComponent: Form,
      dialogConfig: {
        title: "自定义",
        width: 720,
        showClose: false,
        customClass: "custom",
        beforeClose: done => done()
      },
      afterClose
    });
    api.openDialog("create");
    expect(dialogOptions()).toMatchObject({
      title: "自定义",
      width: 720,
      showClose: false,
      class: "custom"
    });
    dialogOptions().closeCallBack();
    expect(api.visible.value).toBe(false);
    expect(afterClose).toHaveBeenCalledOnce();

    let quick!: ReturnType<typeof useQuickDialog>;
    const quickWrapper = mount(
      defineComponent({
        setup() {
          quick = useQuickDialog();
          return () => h("div");
        }
      })
    );
    quick.openQuickDialog({ title: "确认", content: "内容", onConfirm });
    expect(dialogOptions().title).toBe("确认");
    expect(dialogOptions().contentRenderer()).toBeTruthy();
    const done = vi.fn();
    await dialogOptions().beforeSure(done);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(done).toHaveBeenCalledOnce();

    onConfirm.mockRejectedValueOnce(new Error("nope"));
    const failedDone = vi.fn();
    await dialogOptions().beforeSure(failedDone);
    expect(failedDone).not.toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalled();
    quickWrapper.unmount();
    wrapper.unmount();
  });

  it("validates, transforms and submits create data, then closes and refreshes", async () => {
    const submitApi = vi
      .fn()
      .mockResolvedValue({ code: 200, data: { uid: "new" } });
    const afterSubmit = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { api, wrapper } = setup({
      formComponent: Form,
      defaultFormData: { name: "旧" },
      submitApi,
      beforeSubmit: async (mode, data) => ({
        ...data,
        name: `${mode}:${data.name}`
      }),
      afterSubmit
    });
    api.openDialog("create");
    const formRef = dialogOptions().props.ref;
    formRef.value = { validate: vi.fn().mockResolvedValue(true) };
    api.setRefreshCallback(refresh);
    await api.submitForm();
    expect(submitApi).toHaveBeenCalledWith({ name: "create:旧" });
    expect(afterSubmit).toHaveBeenCalledWith("create", {
      code: 200,
      data: { uid: "new" }
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(api.visible.value).toBe(false);
    expect(messageMock).toHaveBeenCalledWith("创建成功", { type: "success" });
    wrapper.unmount();
  });

  it("updates edit data and reports missing form, validation and uid guards", async () => {
    const updateApi = vi
      .fn()
      .mockResolvedValue({ code: 200, data: { uid: "u1" } });
    const { api, wrapper } = setup({
      formComponent: Form,
      defaultFormData: { uid: "u1", name: "A" },
      updateApi
    });
    await api.submitForm();
    expect(loggerMock.warn).toHaveBeenCalledWith("formRef is not available");

    api.openDialog("edit", { uid: "u1", name: "B" } as any);
    const formRef = dialogOptions().props.ref;
    formRef.value = { validate: vi.fn().mockResolvedValue(false) };
    await api.submitForm();
    expect(messageMock).toHaveBeenCalledWith("请检查表单数据", {
      type: "warning"
    });

    formRef.value = { validate: vi.fn().mockResolvedValue(true) };
    api.openDialog("edit", { uid: "", name: "B" } as any);
    await api.submitForm();
    expect(messageMock).toHaveBeenCalledWith("缺少 ID", { type: "error" });

    api.openDialog("edit", { uid: "u1", name: "B" } as any);
    await api.submitForm();
    expect(updateApi).toHaveBeenCalledWith("u1", { uid: "u1", name: "B" });
    expect(messageMock).toHaveBeenCalledWith("更新成功", { type: "success" });
    wrapper.unmount();
  });

  it("reports submission errors directly or through the caller hook and rethrows", async () => {
    const onError = vi.fn();
    const submitApi = vi.fn().mockRejectedValue(new Error("submit"));
    const { api, wrapper } = setup({
      formComponent: Form,
      submitApi,
      onSubmitError: onError
    });
    api.openDialog("create");
    dialogOptions().props.ref.value = {
      validate: vi.fn().mockResolvedValue(true)
    };
    await expect(api.submitForm()).rejects.toThrow("submit");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    const direct = setup({ formComponent: Form, submitApi });
    direct.api.openDialog("create");
    dialogOptions().props.ref.value = {
      validate: vi.fn().mockResolvedValue(true)
    };
    await expect(direct.api.submitForm()).rejects.toThrow("submit");
    expect(messageMock).toHaveBeenCalledWith("提交失败", { type: "error" });
    expect(loggerMock.error).toHaveBeenCalled();
    wrapper.unmount();
    direct.wrapper.unmount();
  });

  it("supports unsupported mode and page-state helper refresh wiring", async () => {
    const { api, wrapper } = setup({ formComponent: Form });
    api.openDialog("view");
    dialogOptions().props.ref.value = {
      validate: vi.fn().mockResolvedValue(true)
    };
    await expect(api.submitForm()).rejects.toThrow("不支持的模式或缺少 API");

    const refresh = vi.fn().mockResolvedValue(undefined);
    const helper = useFormDialogWithPageState({ formComponent: Form }, refresh);
    helper.openDialog("create");
    dialogOptions().props.ref.value = {
      validate: vi.fn().mockResolvedValue(true)
    };
    await helper.submitForm().catch(() => undefined);
    wrapper.unmount();
  });
});
