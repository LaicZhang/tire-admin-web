import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  upload: vi.fn(),
  restore: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
  message: vi.fn(),
  downloadBlob: vi.fn()
}));

vi.mock("@/api/setting", () => ({
  getBackupListApi: mocks.list,
  createBackupApi: mocks.create,
  uploadBackupApi: mocks.upload,
  restoreBackupApi: mocks.restore,
  downloadBackupApi: mocks.download,
  deleteBackupApi: mocks.remove,
  getBackupSettingsApi: mocks.getSettings,
  updateBackupSettingsApi: mocks.saveSettings
}));

vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));

vi.mock("@/utils/download", () => ({ downloadBlob: mocks.downloadBlob }));

vi.mock("element-plus", async importOriginal => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return {
    ...actual,
    ElMessageBox: { prompt: mocks.prompt }
  };
});

function ok(data?: unknown) {
  return Promise.resolve({ code: 200, data });
}

function records() {
  return [
    {
      uid: "success-auto",
      fileName: "2026-01-01.sql",
      fileSize: 2048,
      action: "backup",
      issuerId: "system",
      issuerName: "",
      status: "SUCCESS",
      createdAt: "2026-01-01 02:00:00"
    },
    {
      uid: "failed-manual",
      fileName: "manual.sql",
      fileSize: 0,
      action: "backup",
      issuerId: "u1",
      issuerName: "张三",
      status: "FAILED",
      createdAt: "2026-01-02 02:00:00"
    },
    {
      uid: "pending",
      fileName: "pending.sql",
      action: "backup",
      issuerId: "u2",
      status: "PENDING"
    },
    {
      uid: "restoring",
      fileName: "restoring.sql",
      action: "backup",
      issuerId: "u3",
      status: "RESTORING"
    },
    { uid: "ignored", fileName: "restore.log", action: "restore" }
  ];
}

function prime() {
  mocks.list.mockReturnValue(ok({ list: records() }));
  mocks.getSettings.mockReturnValue(
    ok({
      autoBackupEnabled: true,
      autoBackupTime: "03:00",
      autoBackupFrequency: "weekly",
      autoBackupWeekDay: 2,
      keepDays: 14
    })
  );
  mocks.create.mockResolvedValue({ code: 200 });
  mocks.upload.mockResolvedValue({ code: 200 });
  mocks.restore.mockResolvedValue({ code: 200 });
  mocks.download.mockResolvedValue(new Blob(["backup"]));
  mocks.remove.mockResolvedValue({ code: 200 });
  mocks.saveSettings.mockResolvedValue({ code: 200 });
  mocks.confirm.mockResolvedValue(true);
  mocks.prompt.mockResolvedValue({ value: "恢复原因充分" });
}

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "settings/backup/index.vue",
    { keepMounted: true, deep: true }
  );
  await vi.waitFor(() => expect(mocks.list).toHaveBeenCalledWith(1));
  await flushPromises();
  return wrapper;
}

function state(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

function button(wrapper: Awaited<ReturnType<typeof mountPage>>, text: string) {
  const match = wrapper
    .findAll("el-button-stub")
    .find(item => item.text() === text);
  if (!match) throw new Error(`button ${text} not found`);
  return match;
}

describe("backup settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prime();
  });

  it("loads settings and normalizes all list statuses while filtering restore actions", async () => {
    const wrapper = await mountPage();
    const stateValues = state(wrapper);

    expect(stateValues.backupSettings).toMatchObject({
      autoBackupEnabled: true,
      autoBackupTime: "03:00",
      autoBackupFrequency: "weekly",
      autoBackupWeekDay: 2,
      keepDays: 14
    });
    expect(stateValues.backupList).toHaveLength(4);
    expect(stateValues.backupList.map((item: any) => item.status)).toEqual([
      "success",
      "failed",
      "pending",
      "processing"
    ]);
    expect(stateValues.backupList[0]).toMatchObject({
      backupType: "auto",
      backupTypeName: "自动备份",
      operatorName: "system",
      fileSizeText: "2.00 KB"
    });
    expect(stateValues.backupList[1]).toMatchObject({
      backupType: "manual",
      operatorName: "张三"
    });
    expect(wrapper.text()).toContain("自动备份设置");
    expect(
      wrapper.findAll("el-button-stub").filter(item => item.text() === "删除")
    ).toHaveLength(4);
    expect(wrapper.findAll("el-select-stub")).toHaveLength(2);
    wrapper.unmount();
  });

  it.each([
    ["weekly", 2],
    ["daily", 1]
  ])(
    "saves %s settings from the conditional UI",
    async (frequency, selectCount) => {
      mocks.getSettings.mockResolvedValue(
        ok({
          autoBackupEnabled: true,
          autoBackupFrequency: frequency
        })
      );
      const wrapper = await mountPage();
      expect(wrapper.findAll("el-select-stub")).toHaveLength(selectCount);

      await wrapper.find("el-switch-stub").trigger("change");
      await vi.waitFor(() =>
        expect(mocks.saveSettings).toHaveBeenCalledTimes(1)
      );
      expect(mocks.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          autoBackupEnabled: true,
          autoBackupFrequency: frequency
        })
      );
      expect(mocks.message).toHaveBeenCalledWith("设置保存成功", {
        type: "success"
      });
      wrapper.unmount();
    }
  );

  it("reports settings and list envelope failures and catches thrown loads", async () => {
    mocks.getSettings.mockResolvedValue({ code: 500, msg: "设置失败" });
    mocks.list.mockResolvedValue({ code: 500 });
    const wrapper = await mountPage();

    expect(mocks.message).toHaveBeenCalledWith("设置失败", { type: "error" });
    expect(mocks.message).toHaveBeenCalledWith("加载备份列表失败", {
      type: "error"
    });
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();

    mocks.message.mockClear();
    mocks.getSettings.mockRejectedValue(new Error("network"));
    mocks.list.mockRejectedValue(new Error("network"));
    const failed = await mountPage();
    expect(mocks.message).toHaveBeenCalledWith("加载备份设置失败", {
      type: "error"
    });
    expect(mocks.message).toHaveBeenCalledWith("加载备份列表失败", {
      type: "error"
    });
    failed.unmount();
  });

  it("starts a backup and reloads, including failure and cancellation", async () => {
    const wrapper = await mountPage();
    mocks.list.mockClear();

    await button(wrapper, "开始备份").trigger("click");
    await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(1));
    expect(mocks.message).toHaveBeenCalledWith("备份任务已启动", {
      type: "success"
    });

    mocks.create.mockResolvedValue({ code: 500 });
    await button(wrapper, "开始备份").trigger("click");
    await flushPromises();
    expect(mocks.message).toHaveBeenCalledWith("启动备份失败", {
      type: "error"
    });

    mocks.create.mockRejectedValue(new Error("cancelled"));
    await button(wrapper, "开始备份").trigger("click");
    await flushPromises();
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();
  });

  it("uploads files with success, envelope failure and thrown request paths", async () => {
    const wrapper = await mountPage();
    const request = state(wrapper).handleUploadRequest;
    const success = {
      file: new File(["sql"], "db.sql"),
      method: "post",
      action: "/backup",
      onSuccess: vi.fn(),
      onError: vi.fn()
    };
    await request(success);
    expect(mocks.upload.mock.calls[0][0]).toBeInstanceOf(FormData);
    expect(success.onSuccess).toHaveBeenCalledWith({ code: 200 });
    expect(mocks.message).toHaveBeenCalledWith("上传成功", { type: "success" });

    const rejected = { ...success, onSuccess: vi.fn(), onError: vi.fn() };
    mocks.upload.mockResolvedValue({ code: 500 });
    await request(rejected);
    expect(rejected.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "UploadAjaxError",
        status: 0,
        method: "post",
        url: "/backup",
        message: "上传失败"
      })
    );
    expect(mocks.message).toHaveBeenCalledWith("上传失败", { type: "error" });

    const thrown = { ...success, onSuccess: vi.fn(), onError: vi.fn() };
    mocks.upload.mockRejectedValue(new Error("offline"));
    await request(thrown);
    expect(thrown.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "offline" })
    );
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();
  });

  it("restores only successful records after a validated prompt", async () => {
    const wrapper = await mountPage();
    const rows = state(wrapper).backupList;

    await state(wrapper).restoreBackup(rows[1]);
    expect(mocks.prompt).not.toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("只能恢复成功的备份", {
      type: "warning"
    });

    await state(wrapper).restoreBackup(rows[0]);
    expect(mocks.restore).toHaveBeenCalledWith("success-auto", {
      confirm: true,
      reason: "恢复原因充分"
    });
    expect(mocks.message).toHaveBeenCalledWith("恢复任务已启动", {
      type: "success"
    });
    const promptOptions = mocks.prompt.mock.calls[0][2];
    expect(promptOptions.inputValidator("1234")).toBe(
      "请输入至少5个字符的恢复原因"
    );
    expect(promptOptions.inputValidator("12345")).toBe(true);

    mocks.prompt.mockResolvedValue("字符串恢复原因");
    await state(wrapper).restoreBackup(rows[0]);
    expect(mocks.restore).toHaveBeenLastCalledWith("success-auto", {
      confirm: true,
      reason: "字符串恢复原因"
    });
    wrapper.unmount();
  });

  it("covers restore cancellation, API failures and reload", async () => {
    const wrapper = await mountPage();
    const row = state(wrapper).backupList[0];
    mocks.list.mockClear();
    mocks.prompt.mockRejectedValue("cancel");
    await state(wrapper).restoreBackup(row);
    expect(mocks.message).not.toHaveBeenCalledWith("恢复失败", {
      type: "error"
    });

    mocks.prompt.mockRejectedValue(new Error("prompt failed"));
    await state(wrapper).restoreBackup(row);
    expect(mocks.message).toHaveBeenCalledWith("恢复失败", { type: "error" });

    mocks.prompt.mockResolvedValue({ value: "恢复原因充分" });
    mocks.restore.mockResolvedValue({ code: 500 });
    await state(wrapper).restoreBackup(row);
    expect(mocks.message).toHaveBeenCalledWith("恢复失败", { type: "error" });
    expect(mocks.list).not.toHaveBeenCalled();

    mocks.restore.mockResolvedValue({ code: 200 });
    await state(wrapper).restoreBackup(row);
    await vi.waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(1));
    wrapper.unmount();
  });

  it("downloads successful backups with a fallback file name and reports failures", async () => {
    const wrapper = await mountPage();
    const rows = state(wrapper).backupList;
    await state(wrapper).downloadBackup(rows[1]);
    expect(mocks.message).toHaveBeenCalledWith("只能下载成功的备份", {
      type: "warning"
    });

    await state(wrapper).downloadBackup(rows[0]);
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "2026-01-01.sql",
      { showMessage: true }
    );

    rows[0].fileName = "";
    await state(wrapper).downloadBackup(rows[0]);
    expect(mocks.downloadBlob).toHaveBeenLastCalledWith(
      expect.any(Blob),
      "backup-success-auto.zip",
      { showMessage: true }
    );

    mocks.download.mockRejectedValue(new Error("download"));
    await state(wrapper).downloadBackup(rows[0]);
    expect(mocks.message).toHaveBeenCalledWith("下载失败", { type: "error" });
    wrapper.unmount();
  });

  it("deletes only after confirmation and handles all delete outcomes", async () => {
    const wrapper = await mountPage();
    const row = state(wrapper).backupList[0];
    mocks.confirm.mockResolvedValue(false);
    await state(wrapper).deleteBackup(row);
    expect(mocks.remove).not.toHaveBeenCalled();

    mocks.confirm.mockResolvedValue(true);
    await state(wrapper).deleteBackup(row);
    expect(mocks.remove).toHaveBeenCalledWith("success-auto");
    expect(mocks.message).toHaveBeenCalledWith("删除成功", { type: "success" });

    mocks.remove.mockResolvedValue({ code: 500 });
    await state(wrapper).deleteBackup(row);
    expect(mocks.message).toHaveBeenCalledWith("删除失败", { type: "error" });

    mocks.remove.mockRejectedValue(new Error("delete"));
    await state(wrapper).deleteBackup(row);
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();
  });

  it("reports setting save envelope and thrown failures", async () => {
    const wrapper = await mountPage();
    mocks.saveSettings.mockResolvedValue({ code: 500 });
    await state(wrapper).saveSettings();
    expect(mocks.message).toHaveBeenCalledWith("设置保存失败", {
      type: "error"
    });

    mocks.saveSettings.mockRejectedValue(new Error("save"));
    await state(wrapper).saveSettings();
    expect(mocks.message).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
});
