<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/composables/useDialogService";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { message } from "@/utils";
import AddFill from "~icons/ri/add-circle-line";
import {
  createPurchaseInquiryApi,
  getPurchaseInquiryListApi,
  sendPurchaseInquiryApi,
  type CreatePurchaseInquiryApiDto,
  type PurchaseInquiryDto
} from "@/api/business/purchase-inquiry";
import { columns } from "./columns";
import PurchaseInquiryFormDialog from "./components/PurchaseInquiryFormDialog.vue";
import { openPurchaseQuotationManagerDialog } from "./usePurchaseQuotationDialogs";

defineOptions({
  name: "PurchaseInquiry"
});

interface PurchaseInquiryFormExpose {
  validate: () => Promise<boolean>;
  getPayload: () => CreatePurchaseInquiryApiDto;
}

const dataList = ref<PurchaseInquiryDto[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

async function getData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getPurchaseInquiryListApi({
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize
    });
    if (code !== 200) {
      message(msg || "获取采购询价失败", { type: "error" });
      return;
    }
    dataList.value = data.list ?? [];
    pagination.value.total = data.total ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "获取采购询价失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleCurrentChange(page: number) {
  pagination.value.currentPage = page;
  void getData();
}

function openCreateDialog() {
  const formRef = ref<PurchaseInquiryFormExpose | null>(null);
  addDialog({
    title: "新增询价单",
    width: "780px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(PurchaseInquiryFormDialog, {
        ref: formRef
      }),
    beforeSure: async done => {
      try {
        const valid = await formRef.value?.validate();
        if (!valid) return;

        const payload = formRef.value?.getPayload();
        if (!payload) return;

        await createPurchaseInquiryApi(payload);
        message("询价单创建成功", { type: "success" });
        done();
        await getData();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "创建询价单失败";
        message(msg, { type: "error" });
      }
    }
  });
}

async function handleSend(row: PurchaseInquiryDto) {
  try {
    await sendPurchaseInquiryApi(row.id);
    message("询价单发送成功", { type: "success" });
    await getData();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "发送询价单失败";
    message(msg, { type: "error" });
  }
}

function canSend(row: PurchaseInquiryDto) {
  return row.status === "DRAFT";
}

function openQuotationManager(row: PurchaseInquiryDto) {
  openPurchaseQuotationManagerDialog(row, getData);
}

onMounted(() => {
  void getData();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <PureTableBar title="采购询价管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            新增询价
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :loading="loading"
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                v-if="canSend(row)"
                class="reset-margin"
                link
                type="primary"
                @click="handleSend(row)"
              >
                发送询价
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="success"
                @click="openQuotationManager(row)"
              >
                报价管理
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
