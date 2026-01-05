import { ref } from "vue";
import { message } from "@/utils/message";
import { createChatApi } from "@/api";

export function useAiEntrySession() {
  const chatUid = ref("");
  const batchId = ref("");

  const initChatSession = async () => {
    try {
      const { data, code, msg } = await createChatApi();
      if (code === 200 && data) {
        const sessionData = data as { uid?: string; batchId?: string };
        chatUid.value = sessionData.uid || "";
        batchId.value = sessionData.batchId || "";
      } else {
        message(msg || "初始化会话失败", { type: "error" });
      }
    } catch {
      message("初始化会话失败", { type: "error" });
    }
  };

  const reset = () => {
    chatUid.value = "";
    batchId.value = "";
  };

  return {
    chatUid,
    batchId,
    initChatSession,
    reset
  };
}
