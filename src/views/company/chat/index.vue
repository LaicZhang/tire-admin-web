<script setup lang="ts">
import { ref, onMounted } from "vue";
import { createChatApi, chatApi, getChatApi, getChatCountApi } from "@/api";
import { message } from "@/utils";
import { Loading } from "@element-plus/icons-vue";

defineOptions({
  name: "chat"
});

const chatUid = ref("");
const batchId = ref("");
const chatHistory = ref<Array<{ role: string; content: string }>>([]);
const inputMessage = ref("");
const loading = ref(false);
const chatCount = ref(0);

const initNewChat = async () => {
  try {
    loading.value = true;
    const { data, code, msg } = await createChatApi();
    if (code === 200) {
      chatUid.value = data.uid || "";
      batchId.value = data.batchId || "";
      chatHistory.value = data.messages || [];
      message("新对话已创建", { type: "success" });
    } else {
      message(msg || "创建对话失败", { type: "error" });
    }
  } catch (error) {
    message("创建对话失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (inputMessage.value.trim() === "") return;
  if (!chatUid.value) {
    await initNewChat();
  }

  const userMessage = {
    role: "user",
    content: inputMessage.value.trim()
  };

  chatHistory.value.push(userMessage);
  const currentMessage = inputMessage.value.trim();
  inputMessage.value = "";

  try {
    loading.value = true;
    const { data, code, msg } = await chatApi({
      uid: chatUid.value,
      batchId: batchId.value,
      messages: chatHistory.value
      // Note: url 和 model 由后端配置管理，前端不应暴露第三方 API 地址
    });

    if (code === 200) {
      if (data.messages) {
        const resData = data as {
          messages: Array<{ role: string; content: string }>;
        };
        chatHistory.value = resData.messages;
      }
    } else {
      message(msg || "发送消息失败", { type: "error" });
      chatHistory.value.pop();
      inputMessage.value = currentMessage;
    }
  } catch (error) {
    message("发送消息失败", { type: "error" });
    chatHistory.value.pop();
    inputMessage.value = currentMessage;
  } finally {
    loading.value = false;
  }
};

const loadChatCount = async () => {
  try {
    const { data, code } = await getChatCountApi();
    if (code === 200) {
      chatCount.value = data.count || 0;
    }
  } catch (error) {
    // 静默处理错误，避免影响用户体验
  }
};

onMounted(async () => {
  await loadChatCount();
});
</script>

<template>
  <el-card>
    <div class="flex h-[75vh]">
      <aside class="w-64 bg-white p-6 border-r">
        <div class="flex items-center space-x-2 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-[#5f6368] h-6 w-6"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M17 12h.01" />
            <path d="M12 12h.01" />
            <path d="M7 12h.01" />
          </svg>
          <span class="font-bold text-lg">ChatGPT</span>
        </div>
        <nav class="space-y-2">
          <div class="space-y-1">
            <h3
              class="text-xs font-semibold text-[#5f6368] uppercase tracking-wide"
            >
              Conversations
            </h3>
            <button
              class="flex items-center space-x-2 py-2 px-3 bg-gray-100 rounded-md w-full text-left hover:bg-gray-200"
              @click="initNewChat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-[#5f6368] h-5 w-5"
              >
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
              </svg>
              <span> 新对话 </span>
            </button>
            <div v-if="chatCount > 0" class="text-xs text-gray-500 mt-2">
              历史记录: {{ chatCount }} 条
            </div>
          </div>
        </nav>
      </aside>
      <main class="flex flex-col flex-1">
        <header class="flex items-center justify-between p-4 border-b">
          <h1 class="font-semibold text-lg">New Chat</h1>
          <div class="flex items-center space-x-2">
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              GPT-3.5
            </button>
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              GPT-4
            </button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-[#5f6368] h-6 w-6"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-[#5f6368] h-6 w-6"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
              />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
          </div>
        </header>
        <div class="flex-1 bg-gray-50 p-6 space-y-4 overflow-y-auto">
          <div
            v-if="chatHistory.length === 0"
            class="text-center text-gray-400 mt-20"
          >
            <p>开始新的对话吧</p>
            <p class="text-sm mt-2">点击左侧"新对话"按钮开始</p>
          </div>
          <div
            v-for="(msg, index) in chatHistory"
            :key="index"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[70%] rounded-lg p-4"
              :class="
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              "
            >
              <div class="whitespace-pre-wrap">{{ msg.content }}</div>
            </div>
          </div>
          <div v-if="loading" class="text-center text-gray-400">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2">AI 正在思考...</span>
          </div>
        </div>
        <footer class="p-4">
          <div class="flex items-center">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="输入消息并按 Enter 发送，Shift+Enter 换行"
              @keyup.enter.ctrl="sendMessage"
              @keyup.enter.shift.exact="sendMessage"
            />
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 ml-2"
              @click="sendMessage"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-500 h-6 w-6"
              >
                <path
                  d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                />
              </svg>
            </button>
          </div>
        </footer>
      </main>
    </div>
  </el-card>
</template>
