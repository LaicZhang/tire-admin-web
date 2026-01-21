<script setup lang="ts">
import { h, ref, watch } from "vue";
import { message } from "@/utils";
import { getCustomerFollowUpListApi, createCustomerFollowUpApi } from "@/api";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import dayjs from "dayjs";
import FollowUpAddForm from "./FollowUpAddForm.vue";

interface FollowUp {
  id: number;
  content: string;
  type?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  operator?: { name: string };
}

interface Props {
  customerUid?: string;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  customerUid: "",
  visible: false
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const loading = ref(false);
const followUpList = ref<FollowUp[]>([]);

async function loadFollowUps() {
  if (!props.customerUid) return;

  loading.value = true;
  try {
    const { data, code } = await getCustomerFollowUpListApi(props.customerUid);
    if (code === 200) {
      followUpList.value = (data || []) as FollowUp[];
    }
  } finally {
    loading.value = false;
  }
}

function openAddForm() {
  addDialog({
    title: "添加跟进记录",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(FollowUpAddForm, {
        customerUid: props.customerUid,
        createApi: createCustomerFollowUpApi,
        onSuccess: async () => {
          closeAllDialog();
          await loadFollowUps();
        },
        onClose: () => closeAllDialog()
      })
  });
}

function formatDate(date: string) {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

function getTypeLabel(type?: string) {
  const followUpTypes = [
    { label: "电话", value: "phone" },
    { label: "微信", value: "wechat" },
    { label: "拜访", value: "visit" },
    { label: "邮件", value: "email" },
    { label: "其他", value: "other" }
  ];
  const item = followUpTypes.find(t => t.value === type);
  return item?.label || type || "其他";
}

watch(
  () => props.customerUid,
  uid => {
    if (uid) {
      loadFollowUps();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="follow-up-panel">
    <div class="header mb-4 flex justify-between items-center">
      <h3 class="text-lg font-medium">跟进记录</h3>
      <el-button type="primary" size="small" @click="openAddForm">
        添加跟进
      </el-button>
    </div>

    <el-timeline v-if="followUpList.length > 0">
      <el-timeline-item
        v-for="item in followUpList"
        :key="item.id"
        :timestamp="formatDate(item.createdAt)"
        placement="top"
      >
        <el-card shadow="hover">
          <div class="flex justify-between items-start">
            <div>
              <el-tag size="small" class="mb-2">
                {{ getTypeLabel(item.type) }}
              </el-tag>
              <p class="text-sm text-gray-600">{{ item.content }}</p>
              <p
                v-if="item.nextFollowUpDate"
                class="text-xs text-gray-400 mt-2"
              >
                下次跟进：{{ formatDate(item.nextFollowUpDate) }}
              </p>
            </div>
            <span v-if="item.operator" class="text-xs text-gray-400">
              {{ item.operator.name }}
            </span>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty v-else description="暂无跟进记录" />
  </div>
</template>
