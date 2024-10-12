<script setup lang="ts">
import { ref, h } from "vue";
defineOptions({
  name: "chat"
});
const uid = ref("");
const initNewChat = async () => {
  // const {code,data,message} = await getNewChatId()
  // if(code === 200){
  // }
};
const message = ref("");

const sendMessage = () => {
  if (message.value.trim() === "") return;
  // Add your logic to handle sending the message here
  console.log("Message sent:", message.value.trim());
  message.value = "";
};
// onMounted(async() => {
//   await initNewChat()
// })
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
            <a
              href="https://kimi.moonshot.cn/"
              target="_blank"
              class="flex items-center space-x-2 py-2 px-3 bg-gray-100 rounded-md"
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
              <span> 新对话(kimi) </span>
            </a>
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
        <div class="flex-1 bg-gray-50 p-6 space-y-4" />
        <footer class="p-4">
          <div class="flex items-center">
            <input
              v-model="message"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
              placeholder="Type a message and press [Enter] to send, press [Shift]+[Enter] to start a new line."
              @keyup.enter="sendMessage"
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
