<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h, onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import { getOrderListApi } from "@/api/business/order";
import {
  convertSaleQuotationApi,
  createSaleQuotationApi,
  getSaleQuotationOrderListApi,
  updateSaleQuotationStatusApi,
  type CreateSaleQuotationApiDto,
  type SaleQuotationDto,
  type SaleQuotationStatus
} from "@/api/business/sale-quotation";
import { message } from "@/utils";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import { ElOption, ElSelect } from "element-plus";
import SaleQuotationFormDialog from "./components/SaleQuotationFormDialog.vue";

defineOptions({
  name: "SalesQuotation"
});

interface SaleQuotationFormExpose {
  validate: () => Promise<boolean>;
  getPayload: () => CreateSaleQuotationApiDto;
}

interface SaleOrderCandidate {
  uid: string;
  number?: string | number;
  desc?: string | null;
}

const dataList = ref<SaleQuotationDto[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const getData = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getSaleQuotationOrderListApi({
      index: pagination.value.currentPage
    });
    if (code === 200) {
      dataList.value = data.list || [];
      pagination.value.total = data.total ?? 0;
      return;
    }
    message(msg || "加载失败", { type: "error" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "加载失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  void getData();
};

const resolveQuotationCustomerId = (row: SaleQuotationDto) => {
  return row.customerId || row.customer?.uid || "";
};

const loadSaleOrderCandidates = async (customerId: string) => {
  const { data, code, msg } = await getOrderListApi<SaleOrderCandidate>(
    "sale-order",
    1,
    {
      customerId,
      pageSize: 100
    }
  );
  if (code !== 200) {
    throw new Error(msg || "加载销售订单失败");
  }
  return (data.list || []).filter(
    item => typeof item.uid === "string" && item.uid.length > 0
  );
};

const promptSaleOrderUid = async (row: SaleQuotationDto) => {
  const customerId = resolveQuotationCustomerId(row);
  if (!customerId) {
    throw new Error("报价单缺少客户信息，无法匹配销售订单");
  }

  const linkedOrderUids = new Set(
    (row.orders || [])
      .map(item => item.saleOrderUid)
      .filter((value): value is string => typeof value === "string")
  );
  const candidates = (await loadSaleOrderCandidates(customerId)).filter(
    item => !linkedOrderUids.has(item.uid)
  );
  if (candidates.length === 0) {
    throw new Error("未找到可关联的销售订单，请先创建销售订单");
  }

  const selectedUid = ref(candidates[0].uid);
  return await new Promise<string>((resolve, reject) => {
    addDialog({
      title: "选择关联销售订单",
      width: "560px",
      draggable: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h("div", { class: "space-y-3" }, [
          h(
            "div",
            { class: "text-sm text-gray-500" },
            "销售报价需要关联一张已存在的销售订单，系统不会自动补仓库信息。"
          ),
          h(
            ElSelect,
            {
              modelValue: selectedUid.value,
              "onUpdate:modelValue": (value: string) => {
                selectedUid.value = value;
              },
              class: "w-full",
              placeholder: "请选择销售订单"
            },
            () =>
              candidates.map(item =>
                h(ElOption, {
                  key: item.uid,
                  label: `${item.number ?? item.uid}${
                    item.desc ? ` | ${item.desc}` : ""
                  }`,
                  value: item.uid
                })
              )
          )
        ]),
      beforeSure: done => {
        if (!selectedUid.value) {
          message("请选择销售订单", { type: "warning" });
          return;
        }
        done();
        resolve(selectedUid.value);
      },
      closeCallBack: () => {
        reject(new Error("cancel"));
      }
    });
  });
};

const openCreateDialog = () => {
  const formRef = ref<SaleQuotationFormExpose | null>(null);
  addDialog({
    title: "新增报价单",
    width: "780px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(SaleQuotationFormDialog, {
        ref: formRef
      }),
    beforeSure: async done => {
      try {
        const valid = await formRef.value?.validate();
        if (!valid) return;

        const payload = formRef.value?.getPayload();
        if (!payload) return;

        await createSaleQuotationApi(payload);
        message("创建成功", { type: "success" });
        done();
        await getData();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "创建失败";
        message(msg, { type: "error" });
      }
    }
  });
};

const handleStatusChange = async (
  row: SaleQuotationDto,
  status: SaleQuotationStatus,
  successText: string
) => {
  try {
    await updateSaleQuotationStatusApi(row.id, status);
    message(successText, { type: "success" });
    await getData();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "状态更新失败";
    message(msg, { type: "error" });
  }
};

const handleConvert = async (row: SaleQuotationDto) => {
  try {
    const saleOrderUid = await promptSaleOrderUid(row);
    if (!saleOrderUid) return;
    await convertSaleQuotationApi(row.id, saleOrderUid);
    message("报价单转订单成功", { type: "success" });
    await getData();
  } catch (error) {
    if (error instanceof Error && error.message === "cancel") return;
    const msg = error instanceof Error ? error.message : "转换失败";
    message(msg, { type: "error" });
  }
};

const canConvert = (row: SaleQuotationDto) =>
  row.status !== "REJECTED" &&
  row.status !== "EXPIRED" &&
  !(Array.isArray(row.orders) && row.orders.length > 0);

const canSend = (row: SaleQuotationDto) => row.status === "DRAFT";
const canAccept = (row: SaleQuotationDto) => row.status === "SENT";
const canReject = (row: SaleQuotationDto) => row.status === "SENT";
const canExpire = (row: SaleQuotationDto) => row.status === "SENT";

onMounted(() => {
  void getData();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <PureTableBar title="销售报价单管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            新增报价
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
                v-if="canConvert(row)"
                class="reset-margin"
                link
                type="success"
                @click="handleConvert(row)"
              >
                转订单
              </el-button>
              <el-button
                v-if="canSend(row)"
                class="reset-margin"
                link
                type="primary"
                @click="handleStatusChange(row, 'SENT', '报价单已发送')"
              >
                发送
              </el-button>
              <el-button
                v-if="canAccept(row)"
                class="reset-margin"
                link
                type="primary"
                @click="handleStatusChange(row, 'ACCEPTED', '报价单已接受')"
              >
                接受
              </el-button>
              <el-button
                v-if="canReject(row)"
                class="reset-margin"
                link
                type="warning"
                @click="handleStatusChange(row, 'REJECTED', '报价单已拒绝')"
              >
                拒绝
              </el-button>
              <el-button
                v-if="canExpire(row)"
                class="reset-margin"
                link
                type="info"
                @click="handleStatusChange(row, 'EXPIRED', '报价单已设为过期')"
              >
                设为过期
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
