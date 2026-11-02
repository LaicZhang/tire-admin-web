const { messageMock, downloadBlobMock, api } = vi.hoisted(() => ({
  messageMock: vi.fn(),
  downloadBlobMock: vi.fn(),
  api: {
    getPrintTemplateApi: vi.fn(),
    savePrintTemplateApi: vi.fn(),
    getExportTaskStatusApi: vi.fn(),
    downloadExportFileApi: vi.fn(),
    downloadImportTemplateApi: vi.fn()
  }
}));

vi.mock("@/api/tools", () => api);
vi.mock("@/utils/message", () => ({ message: messageMock }));
vi.mock("@/utils/download", () => ({ downloadBlob: downloadBlobMock }));

import { useIoPrint } from "../useIoPrint";
import { useIoTask } from "../useIoTask";
import { useIoTemplate } from "../useIoTemplate";

describe("useIoPrint", () => {
  beforeEach(() => {
    messageMock.mockReset();
    api.getPrintTemplateApi.mockReset();
    api.savePrintTemplateApi.mockReset();
  });

  it("loads and saves valid templates", async () => {
    api.getPrintTemplateApi.mockResolvedValue({
      code: 200,
      data: { template: "<h1>fixture</h1>" }
    });
    api.savePrintTemplateApi.mockResolvedValue({ code: 200 });
    const io = useIoPrint();
    expect(io.printTypeOptions).toHaveLength(4);
    await io.loadPrintTemplate();
    expect(io.printTemplate.value).toBe("<h1>fixture</h1>");
    expect(io.printLoading.value).toBe(false);
    await io.savePrintTemplate();
    expect(api.savePrintTemplateApi).toHaveBeenCalledWith({
      type: "sale-order",
      template: "<h1>fixture</h1>"
    });
    expect(messageMock).toHaveBeenLastCalledWith("保存成功", {
      type: "success"
    });
  });

  it("handles empty templates, API failures and exceptions", async () => {
    const io = useIoPrint();
    await io.savePrintTemplate();
    expect(messageMock).toHaveBeenCalledWith("请输入模板内容", {
      type: "warning"
    });

    api.getPrintTemplateApi.mockResolvedValueOnce({
      code: 500,
      msg: "template unavailable"
    });
    await io.loadPrintTemplate();
    expect(messageMock).toHaveBeenLastCalledWith("template unavailable", {
      type: "error"
    });

    api.getPrintTemplateApi.mockRejectedValueOnce(new Error("network"));
    await io.loadPrintTemplate();
    expect(messageMock).toHaveBeenLastCalledWith("加载模板失败", {
      type: "error"
    });

    io.printTemplate.value = "fixture";
    api.savePrintTemplateApi.mockResolvedValueOnce({
      code: 500,
      msg: "save failed"
    });
    await io.savePrintTemplate();
    expect(messageMock).toHaveBeenLastCalledWith("save failed", {
      type: "error"
    });

    api.savePrintTemplateApi.mockRejectedValueOnce(new Error("network"));
    await io.savePrintTemplate();
    expect(messageMock).toHaveBeenLastCalledWith("保存失败", { type: "error" });
  });
});

describe("useIoTask", () => {
  beforeEach(() => {
    messageMock.mockReset();
    downloadBlobMock.mockReset();
    api.getExportTaskStatusApi.mockReset();
    api.downloadExportFileApi.mockReset();
  });

  it("validates missing task IDs", async () => {
    const task = useIoTask();
    await task.checkTask();
    expect(messageMock).toHaveBeenCalledWith("请输入任务ID", {
      type: "warning"
    });
  });

  it.each([
    ["completed", "任务已完成，开始下载", "success"],
    ["processing", "任务处理中，请稍后再试", "info"],
    ["failed", "任务失败: boom", "error"],
    ["queued", "任务状态: queued", "info"]
  ])("handles %s task status", async (status, text, type) => {
    const task = useIoTask();
    task.taskId.value = "task-1";
    api.getExportTaskStatusApi.mockResolvedValue({
      code: 200,
      data: { status, error: status === "failed" ? "boom" : undefined }
    });
    const blob = new Blob(["xlsx"]);
    api.downloadExportFileApi.mockResolvedValue(blob);
    await task.checkTask();
    expect(messageMock).toHaveBeenCalledWith(text, { type });
    if (status === "completed") {
      expect(downloadBlobMock).toHaveBeenCalledWith(blob, "export_task-1.xlsx");
    }
  });

  it("reports API and transport failures", async () => {
    const task = useIoTask();
    task.taskId.value = "task-2";
    api.getExportTaskStatusApi.mockResolvedValueOnce({
      code: 500,
      msg: "offline"
    });
    await task.checkTask();
    expect(messageMock).toHaveBeenLastCalledWith("offline", { type: "error" });

    api.getExportTaskStatusApi.mockRejectedValueOnce(new Error("network"));
    await task.checkTask();
    expect(messageMock).toHaveBeenLastCalledWith("查询失败", { type: "error" });
  });
});

describe("useIoTemplate", () => {
  beforeEach(() => {
    messageMock.mockReset();
    downloadBlobMock.mockReset();
    api.downloadImportTemplateApi.mockReset();
  });

  it("downloads the selected template", async () => {
    const blob = new Blob(["template"]);
    api.downloadImportTemplateApi.mockResolvedValue(blob);
    const template = useIoTemplate();
    template.templateType.value = "tire";
    await template.downloadTemplate();
    expect(api.downloadImportTemplateApi).toHaveBeenCalledWith("tire");
    expect(downloadBlobMock).toHaveBeenCalledWith(blob, "template_tire.xlsx", {
      showMessage: true
    });
  });

  it("reports download errors", async () => {
    api.downloadImportTemplateApi.mockRejectedValue(new Error("network"));
    await useIoTemplate().downloadTemplate();
    expect(messageMock).toHaveBeenCalledWith("下载失败", { type: "error" });
  });
});
