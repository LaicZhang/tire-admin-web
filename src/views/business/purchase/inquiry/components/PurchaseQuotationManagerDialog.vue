<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import dayjs from "dayjs";
import { ElOption, ElSelect } from "element-plus";
import { addDialog } from "@/composables/useDialogService";
import { ALL_LIST, localForage, message } from "@/utils";
import { fenToYuan } from "@/utils/formatMoney";
import {
  acceptPurchaseQuotationApi,
  convertPurchaseQuotationApi,
  createPurchaseQuotationApi,
  getPurchaseQuotationListApi,
  type CreatePurchaseQuotationApiDto,
  type PurchaseInquiryDto,
  type PurchaseQuotationDto
} from "@/api/business/purchase-inquiry";
import PurchaseQuotationFormDialog from "./PurchaseQuotationFormDialog.vue";

interface SelectOption {
  uid: string;
  name: string;
}

interface PurchaseQuotationFormExpose {
  validate: () => Promise<boolean>;
  getPayload: () => CreatePurchaseQuotationApiDto;
}

interface ConvertDialogProps {
  auditorId: string;
  repoId: string;
  desc: string;
}

const props = defineProps<{
  inquiry: PurchaseInquiryDto;
}>();

const emit = defineEmits<{
  changed: [];
}>();

const loading = ref(false);
const dataList = ref<PurchaseQuotationDto[]>([]);

function formatStatus(status?: string) {
  const map: Record<string, string> = {
    PENDING: "待决策",
    ACCEPTED: "已中标",
    REJECTED: "已落选"
  };
  return status ? map[status] || status : "-";
}

function formatAmount(row: PurchaseQuotationDto) {
  const total = row.details.reduce((sum, detail) => {
    return sum + detail.price * detail.quantity;
  }, 0);
  return fenToYuan(total);
}

function formatOrder(row: PurchaseQuotationDto) {
  return row.purchaseOrder?.docNo || row.purchaseOrder?.number || "-";
}

function canCreateQuotation() {
  return props.inquiry.status === "SENT" || props.inquiry.status === "REPLIED";
}

function canAccept(row: PurchaseQuotationDto) {
  return row.status === "PENDING" && !row.purchaseOrderId;
}

function canConvert(row: PurchaseQuotationDto) {
  return row.status === "ACCEPTED" && !row.purchaseOrderId;
}

async function getData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getPurchaseQuotationListApi({
      inquiryId: props.inquiry.id,
      limit: 50
    });
    if (code !== 200) {
      message(msg || "加载采购报价失败", { type: "error" });
      return;
    }
    dataList.value = data.list ?? [];
  } catch (error) {
    const msg = error instanceof Error ? error.message : "加载采购报价失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

function notifyChanged() {
  emit("changed");
}

function openCreateDialog() {
  const formRef = ref<PurchaseQuotationFormExpose | null>(null);
  addDialog({
    title: "录入采购报价",
    width: "760px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(PurchaseQuotationFormDialog, {
        ref: formRef,
        inquiry: props.inquiry
      }),
    beforeSure: async done => {
      try {
        const valid = await formRef.value?.validate();
        if (!valid) return;

        const payload = formRef.value?.getPayload();
        if (!payload) return;

        await createPurchaseQuotationApi(payload);
        message("采购报价已录入", { type: "success" });
        done();
        await getData();
        notifyChanged();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "录入采购报价失败";
        message(msg, { type: "error" });
      }
    }
  });
}

async function handleAccept(row: PurchaseQuotationDto) {
  try {
    await acceptPurchaseQuotationApi(row.id);
    message("已接受该报价", { type: "success" });
    await getData();
    notifyChanged();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "接受报价失败";
    message(msg, { type: "error" });
  }
}

async function openConvertDialog(row: PurchaseQuotationDto) {
  const [managerList, repoList] = await Promise.all([
    localForage().getItem<SelectOption[]>(ALL_LIST.manager),
    localForage().getItem<SelectOption[]>(ALL_LIST.repo)
  ]);

  addDialog({
    title: "采购报价转采购订单",
    width: "560px",
    draggable: true,
    closeOnClickModal: false,
    props: {
      auditorId: "",
      repoId: "",
      desc: ""
    } satisfies ConvertDialogProps,
    contentRenderer: ({ options }) => {
      const current = options.props as ConvertDialogProps;
      return h("div", { class: "space-y-4" }, [
        h(
          "div",
          { class: "text-sm text-gray-500" },
          `供应商：${row.provider?.name || row.providerId}，报价金额：${formatAmount(row)} 元`
        ),
        h("el-form", { labelWidth: "88px" }, [
          h("el-form-item", { label: "审核人" }, [
            h(
              ElSelect,
              {
                modelValue: current.auditorId,
                "onUpdate:modelValue": (value: string) => {
                  current.auditorId = value;
                },
                placeholder: "请选择审核人",
                filterable: true,
                class: "w-full"
              },
              () =>
                (managerList ?? []).map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: item.name,
                    value: item.uid
                  })
                )
            )
          ]),
          h("el-form-item", { label: "仓库" }, [
            h(
              ElSelect,
              {
                modelValue: current.repoId,
                "onUpdate:modelValue": (value: string) => {
                  current.repoId = value;
                },
                placeholder: "请选择仓库",
                filterable: true,
                class: "w-full"
              },
              () =>
                (repoList ?? []).map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: item.name,
                    value: item.uid
                  })
                )
            )
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: current.desc,
              "onUpdate:modelValue": (value: string) => {
                current.desc = value;
              },
              type: "textarea",
              placeholder: "可补充本次转采购订单说明"
            })
          ])
        ])
      ]);
    },
    beforeSure: async (done, { options }) => {
      const current = options.props as ConvertDialogProps;
      if (!current.auditorId) {
        message("请选择审核人", { type: "warning" });
        return;
      }
      if (!current.repoId) {
        message("请选择仓库", { type: "warning" });
        return;
      }

      try {
        await convertPurchaseQuotationApi(row.id, {
          auditorId: current.auditorId,
          repoId: current.repoId,
          ...(current.desc.trim() ? { desc: current.desc.trim() } : {})
        });
        message("采购订单已生成", { type: "success" });
        done();
        await getData();
        notifyChanged();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "转采购订单失败";
        message(msg, { type: "error" });
      }
    }
  });
}

onMounted(() => {
  void getData();
});
</script>

<template>
  <div>
    <div class="mb-4 rounded border border-[var(--el-border-color)] p-4">
      <div class="text-sm text-[var(--el-text-color-secondary)]">询价单</div>
      <div class="mt-2 text-base font-medium">
        #{{ inquiry.id }} /
        {{ inquiry.provider?.name || inquiry.providerId || "未指定供应商" }}
      </div>
      <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
        状态：{{ inquiry.status }}， 截止日期：{{
          inquiry.deadline ? dayjs(inquiry.deadline).format("YYYY-MM-DD") : "-"
        }}
      </div>
    </div>

    <div class="mb-3 flex items-center justify-between">
      <div class="text-sm font-medium">供应商报价</div>
      <el-button
        v-if="canCreateQuotation()"
        type="primary"
        link
        @click="openCreateDialog"
      >
        录入报价
      </el-button>
    </div>

    <el-table v-loading="loading" :data="dataList" border>
      <el-table-column label="报价单 ID" prop="id" width="96" />
      <el-table-column label="供应商" min-width="160">
        <template #default="{ row }">
          {{ row.provider?.name || row.providerId }}
        </template>
      </el-table-column>
      <el-table-column label="报价金额(元)" min-width="120">
        <template #default="{ row }">
          {{ formatAmount(row) }}
        </template>
      </el-table-column>
      <el-table-column label="有效期至" min-width="120">
        <template #default="{ row }">
          {{
            row.validUntil ? dayjs(row.validUntil).format("YYYY-MM-DD") : "-"
          }}
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          {{ formatStatus(row.status) }}
        </template>
      </el-table-column>
      <el-table-column label="关联采购单" min-width="140">
        <template #default="{ row }">
          {{ formatOrder(row) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" prop="remark" />
      <el-table-column label="操作" min-width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canAccept(row)"
            class="reset-margin"
            link
            type="success"
            @click="handleAccept(row)"
          >
            接受报价
          </el-button>
          <el-button
            v-if="canConvert(row)"
            class="reset-margin"
            link
            type="primary"
            @click="openConvertDialog(row)"
          >
            转采购单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
