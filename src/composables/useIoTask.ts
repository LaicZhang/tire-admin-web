import { ref } from "vue";
import { getExportTaskStatusApi, downloadExportFileApi } from "@/api/tools";
import { message } from "@/utils/message";
import { downloadBlob } from "@/utils/download";

export function useIoTask() {
  const taskId = ref("");

  async function checkTask() {
    if (!taskId.value) {
      message("请输入任务ID", { type: "warning" });
      return;
    }
    try {
      const { data, code, msg } = await getExportTaskStatusApi(taskId.value);
      if (code === 200) {
        if (data.status === "completed") {
          message("任务已完成，开始下载", { type: "success" });
          const blob = await downloadExportFileApi(taskId.value);
          downloadBlob(blob, `export_${taskId.value}.xlsx`);
        } else if (data.status === "processing") {
          message("任务处理中，请稍后再试", { type: "info" });
        } else if (data.status === "failed") {
          message("任务失败: " + (data.error || "未知错误"), { type: "error" });
        } else {
          message(`任务状态: ${data.status}`, { type: "info" });
        }
      } else {
        message(msg || "查询失败", { type: "error" });
      }
    } catch {
      message("查询失败", { type: "error" });
    }
  }

  return {
    taskId,
    checkTask
  };
}
