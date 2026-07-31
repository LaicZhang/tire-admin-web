<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";
import AddFill from "~icons/ri/add-circle-line";
import Refresh from "~icons/ep/refresh";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import {
  addPackageToServiceWorkOrderApi,
  addServiceWorkOrderLineApi,
  checkoutServiceWorkOrderApi,
  createServiceWorkOrderApi,
  generateSaleOrderFromWorkOrderApi,
  getServiceWorkOrderApi,
  getServiceWorkOrderListApi,
  removeServiceWorkOrderLineApi,
  updateServiceWorkOrderApi,
  type ServiceWorkOrderItem,
  type ServiceWorkOrderLineType,
  type ServiceWorkOrderStatus
} from "@/api/business/service-work-order";
import { getServicePackageListApi } from "@/api/business/service-package";
import { getTireListApi } from "@/api/business/tire";
import { getStoreListApi, type Store } from "@/api/company/store";
import { getPaymentListApi } from "@/api/payment";
import { ALL_LIST, localForage, message, handleApiError } from "@/utils";
import { fieldRules } from "@/utils/validation/fieldRules";
import { formatMoneyFromFen, yuanToFen } from "@/utils/formatMoney";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

defineOptions({ name: "ServiceWorkOrder" });

const STATUS_LABEL: Record<ServiceWorkOrderStatus, string> = {
  DRAFT: "草稿",
  RECEIVED: "已接车",
  INSPECTING: "检测中",
  QUOTED: "已报价",
  IN_SERVICE: "施工中",
  AWAITING_PAYMENT: "待收款",
  CONVERTED: "已转销售单",
  COMPLETED: "已完成",
  CANCELLED: "已取消"
};

const NEXT_STATUS: Partial<
  Record<ServiceWorkOrderStatus, ServiceWorkOrderStatus[]>
> = {
  DRAFT: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["INSPECTING", "QUOTED", "CANCELLED"],
  INSPECTING: ["QUOTED", "IN_SERVICE", "CANCELLED"],
  QUOTED: ["IN_SERVICE", "AWAITING_PAYMENT", "CANCELLED"],
  IN_SERVICE: ["AWAITING_PAYMENT", "QUOTED", "CANCELLED"],
  CONVERTED: ["AWAITING_PAYMENT", "IN_SERVICE", "COMPLETED"],
  AWAITING_PAYMENT: ["COMPLETED"]
};

const router = useRouter();
const companyStore = useCurrentCompanyStoreHook();

const loading = ref(false);
const saving = ref(false);
const detailLoading = ref(false);
const createVisible = ref(false);
const detailVisible = ref(false);
const list = ref<ServiceWorkOrderItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const current = ref<ServiceWorkOrderItem | null>(null);
const storeOptions = ref<Store[]>([]);
const tireOptions = ref<Array<{ uid: string; name: string }>>([]);
const packageOptions = ref<Array<{ uid: string; name: string }>>([]);
const paymentOptions = ref<Array<{ uid: string; name: string }>>([]);
const formRef = ref<FormInstance>();

const searchForm = reactive({
  status: "" as "" | ServiceWorkOrderStatus
});

const createForm = reactive({
  storeId: "",
  customerId: "",
  vehiclePlateNo: "",
  vehicleModel: "",
  contactPhone: "",
  mileageKm: undefined as number | undefined,
  remark: ""
});

const lineForm = reactive({
  lineType: "TIRE" as ServiceWorkOrderLineType,
  tireId: "",
  packageUid: "",
  qty: 1,
  unitPriceYuan: 0,
  remark: ""
});

const checkoutForm = reactive({
  paymentId: "",
  paymentMethod: "",
  remark: ""
});

const createRules: FormRules = {
  storeId: [fieldRules.uidSelect({ label: "门店" })],
  vehiclePlateNo: [
    fieldRules.name({ label: "车牌号", required: false, max: 32 })
  ]
};

const columns: TableColumnList = [
  { label: "单号", prop: "billNo", minWidth: 140 },
  {
    label: "状态",
    prop: "status",
    minWidth: 110,
    formatter: (row: ServiceWorkOrderItem) =>
      STATUS_LABEL[row.status] || row.status
  },
  {
    label: "门店",
    minWidth: 140,
    formatter: (row: ServiceWorkOrderItem) => row.store?.name || row.storeId
  },
  { label: "车牌", prop: "vehiclePlateNo", minWidth: 110 },
  { label: "联系电话", prop: "contactPhone", minWidth: 120 },
  {
    label: "销售单",
    minWidth: 120,
    formatter: (row: ServiceWorkOrderItem) =>
      row.saleOrderUid ? row.saleOrderUid.slice(0, 8) + "…" : "—"
  },
  { label: "创建时间", prop: "createAt", minWidth: 160 },
  { label: "操作", fixed: "right", width: 100, slot: "operation" }
];

const pagination = computed(() => ({
  total: total.value,
  pageSize,
  currentPage: page.value,
  background: true
}));

const editable = computed(() => {
  const s = current.value?.status;
  return (
    !!s &&
    !["COMPLETED", "CANCELLED", "CONVERTED", "AWAITING_PAYMENT"].includes(s)
  );
});

const nextStatuses = computed(() => {
  if (!current.value) return [];
  return NEXT_STATUS[current.value.status] || [];
});

async function loadStores() {
  const cached = await localForage().getItem<Store[]>(ALL_LIST.store);
  if (cached?.length) {
    storeOptions.value = cached;
    return;
  }
  const { code, data } = await getStoreListApi(0);
  if (code === 200) {
    storeOptions.value = data.list || [];
    await localForage().setItem(ALL_LIST.store, storeOptions.value, 30);
  }
}

async function loadTires() {
  const { code, data } = await getTireListApi(0);
  if (code === 200) {
    tireOptions.value = (data?.list || []).map(
      (t: { uid: string; name?: string | null }) => ({
        uid: t.uid,
        name: t.name || t.uid
      })
    );
  }
}

async function loadPackages() {
  const { code, data } = await getServicePackageListApi(1, { enabled: true });
  if (code === 200) {
    packageOptions.value = (data?.list || []).map(p => ({
      uid: p.uid,
      name: p.name
    }));
  }
}

async function loadPayments() {
  try {
    const res = await getPaymentListApi();
    const data = (res as { data?: unknown }).data ?? res;
    const listData = Array.isArray(data)
      ? data
      : ((data as { list?: unknown[] })?.list ?? []);
    paymentOptions.value = (
      listData as Array<{ uid: string; name?: string }>
    ).map(p => ({ uid: p.uid, name: p.name || p.uid }));
  } catch {
    paymentOptions.value = [];
  }
}

async function loadList() {
  loading.value = true;
  try {
    const { code, data, msg } = await getServiceWorkOrderListApi(page.value, {
      status: searchForm.status || undefined
    });
    if (code !== 200) {
      message(msg || "加载服务工单失败", { type: "error" });
      return;
    }
    list.value = data?.list || [];
    total.value = data?.total || 0;
  } catch (error) {
    handleApiError(error, "加载服务工单失败");
  } finally {
    loading.value = false;
  }
}

function resetCreateForm() {
  createForm.storeId = companyStore.storeId || "";
  createForm.customerId = "";
  createForm.vehiclePlateNo = "";
  createForm.vehicleModel = "";
  createForm.contactPhone = "";
  createForm.mileageKm = undefined;
  createForm.remark = "";
}

function openCreate() {
  resetCreateForm();
  createVisible.value = true;
}

async function submitCreate() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const { code, data, msg } = await createServiceWorkOrderApi({
      storeId: createForm.storeId,
      customerId: createForm.customerId || undefined,
      vehiclePlateNo: createForm.vehiclePlateNo.trim() || undefined,
      vehicleModel: createForm.vehicleModel.trim() || undefined,
      contactPhone: createForm.contactPhone.trim() || undefined,
      mileageKm: createForm.mileageKm,
      remark: createForm.remark.trim() || undefined
    });
    if (code !== 200) {
      message(msg || "创建失败", { type: "error" });
      return;
    }
    message("工单已创建", { type: "success" });
    createVisible.value = false;
    await loadList();
    if (data?.uid) await openDetail(data.uid);
  } catch (error) {
    handleApiError(error, "创建服务工单失败");
  } finally {
    saving.value = false;
  }
}

async function openDetail(uid: string) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const { code, data, msg } = await getServiceWorkOrderApi(uid);
    if (code !== 200 || !data) {
      message(msg || "加载详情失败", { type: "error" });
      return;
    }
    current.value = data;
    lineForm.lineType = "TIRE";
    lineForm.tireId = "";
    lineForm.packageUid = "";
    lineForm.qty = 1;
    lineForm.unitPriceYuan = 0;
    lineForm.remark = "";
  } catch (error) {
    handleApiError(error, "加载工单详情失败");
  } finally {
    detailLoading.value = false;
  }
}

async function refreshDetail() {
  if (!current.value?.uid) return;
  await openDetail(current.value.uid);
  await loadList();
}

async function changeStatus(status: ServiceWorkOrderStatus) {
  if (!current.value) return;
  try {
    const { code, msg } = await updateServiceWorkOrderApi(current.value.uid, {
      status
    });
    if (code !== 200) {
      message(msg || "状态更新失败", { type: "error" });
      return;
    }
    message(`已流转至 ${STATUS_LABEL[status]}`, { type: "success" });
    await refreshDetail();
  } catch (error) {
    handleApiError(error, "状态更新失败");
  }
}

async function saveNotes() {
  if (!current.value) return;
  try {
    const { code, msg } = await updateServiceWorkOrderApi(current.value.uid, {
      inspectionNotes: current.value.inspectionNotes || undefined,
      quoteNotes: current.value.quoteNotes || undefined,
      remark: current.value.remark || undefined,
      vehiclePlateNo: current.value.vehiclePlateNo || undefined,
      vehicleModel: current.value.vehicleModel || undefined,
      contactPhone: current.value.contactPhone || undefined,
      mileageKm: current.value.mileageKm ?? undefined
    });
    if (code !== 200) {
      message(msg || "保存失败", { type: "error" });
      return;
    }
    message("已保存", { type: "success" });
    await refreshDetail();
  } catch (error) {
    handleApiError(error, "保存工单失败");
  }
}

async function addLine() {
  if (!current.value) return;
  try {
    if (lineForm.lineType === "PACKAGE") {
      if (!lineForm.packageUid) {
        message("请选择套餐", { type: "warning" });
        return;
      }
      const { code, msg } = await addPackageToServiceWorkOrderApi(
        current.value.uid,
        { packageUid: lineForm.packageUid, multiplier: lineForm.qty || 1 }
      );
      if (code !== 200) {
        message(msg || "添加套餐失败", { type: "error" });
        return;
      }
    } else {
      if (!lineForm.tireId) {
        message("请选择商品/服务", { type: "warning" });
        return;
      }
      const { code, msg } = await addServiceWorkOrderLineApi(
        current.value.uid,
        {
          lineType: lineForm.lineType,
          tireId: lineForm.tireId,
          qty: lineForm.qty,
          unitPrice: yuanToFen(lineForm.unitPriceYuan)
        }
      );
      if (code !== 200) {
        message(msg || "添加行失败", { type: "error" });
        return;
      }
    }
    message("已添加", { type: "success" });
    await refreshDetail();
  } catch (error) {
    handleApiError(error, "添加工单行失败");
  }
}

async function removeLine(lineUid: string) {
  if (!current.value) return;
  try {
    const { code, msg } = await removeServiceWorkOrderLineApi(
      current.value.uid,
      lineUid
    );
    if (code !== 200) {
      message(msg || "删除失败", { type: "error" });
      return;
    }
    message("行已删除", { type: "success" });
    await refreshDetail();
  } catch (error) {
    handleApiError(error, "删除工单行失败");
  }
}

async function generateSaleOrder() {
  if (!current.value) return;
  try {
    const { code, data, msg } = await generateSaleOrderFromWorkOrderApi(
      current.value.uid
    );
    if (code !== 200) {
      message(msg || "生成销售单失败", { type: "error" });
      return;
    }
    message("已生成草稿销售单", { type: "success" });
    await refreshDetail();
    if (data?.saleOrderUid) {
      // Keep user on SWO; offer navigation via link in detail
    }
  } catch (error) {
    handleApiError(error, "生成销售单失败");
  }
}

async function checkout() {
  if (!current.value) return;
  try {
    const { code, msg } = await checkoutServiceWorkOrderApi(current.value.uid, {
      paymentId: checkoutForm.paymentId || undefined,
      paymentMethod: checkoutForm.paymentMethod || undefined,
      remark: checkoutForm.remark || null
    });
    if (code !== 200) {
      message(msg || "收银失败", { type: "error" });
      return;
    }
    message("已创建收款单", { type: "success" });
    await refreshDetail();
  } catch (error) {
    handleApiError(error, "收银失败");
  }
}

function goSaleOrder() {
  if (!current.value?.saleOrderUid) return;
  void router.push({
    path: "/business/order/sale",
    query: { uid: current.value.saleOrderUid }
  });
}

function goReceipt() {
  if (!current.value?.receiptOrderUid) return;
  void router.push({
    path: "/fund/receipt",
    query: { uid: current.value.receiptOrderUid }
  });
}

function handlePageChange(currentPage: number) {
  page.value = currentPage;
  void loadList();
}

function onSearch() {
  page.value = 1;
  void loadList();
}

function lineAmount(row: { qty?: number; unitPrice?: number | string }) {
  return formatMoneyFromFen(Number(row.unitPrice ?? 0) * Number(row.qty ?? 0));
}

onMounted(async () => {
  await Promise.all([
    loadStores(),
    loadTires(),
    loadPackages(),
    loadPayments(),
    loadList()
  ]);
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      @search="onSearch"
      @reset="
        () => {
          searchForm.status = '';
          onSearch();
        }
      "
    >
      <el-form-item label="状态">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="全部"
          class="w-[160px]"
        >
          <el-option
            v-for="(label, key) in STATUS_LABEL"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="服务工单" @refresh="loadList">
        <template #buttons>
          <Auth value="post/service-work-order">
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openCreate"
            >
              接车开单
            </el-button>
          </Auth>
          <el-button :icon="useRenderIcon(Refresh)" @click="loadList">
            刷新
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            border
            :size
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDetail(row.uid)">
                详情
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <el-dialog
      v-model="createVisible"
      title="接车开单"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="createForm"
        :rules="createRules"
        label-width="96px"
      >
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="createForm.storeId" class="w-full" filterable>
            <el-option
              v-for="s in storeOptions"
              :key="s.uid"
              :label="s.name"
              :value="s.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="createForm.vehiclePlateNo" />
        </el-form-item>
        <el-form-item label="车型">
          <el-input v-model="createForm.vehicleModel" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="createForm.contactPhone" />
        </el-form-item>
        <el-form-item label="里程(km)">
          <el-input-number
            v-model="createForm.mileageKm"
            :min="0"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailVisible"
      title="服务工单详情"
      size="720px"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="space-y-4 px-1">
        <template v-if="current">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="单号">
              {{ current.billNo || current.uid }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              {{ STATUS_LABEL[current.status] || current.status }}
            </el-descriptions-item>
            <el-descriptions-item label="门店">
              {{ current.store?.name || current.storeId }}
            </el-descriptions-item>
            <el-descriptions-item label="车牌">
              <el-input
                v-if="editable"
                v-model="current.vehiclePlateNo"
                size="small"
              />
              <span v-else>{{ current.vehiclePlateNo || "—" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="销售单">
              <el-button
                v-if="current.saleOrderUid"
                link
                type="primary"
                @click="goSaleOrder"
              >
                {{ current.saleOrderUid.slice(0, 8) }}…
              </el-button>
              <span v-else>—</span>
            </el-descriptions-item>
            <el-descriptions-item label="收款单">
              <el-button
                v-if="current.receiptOrderUid"
                link
                type="primary"
                @click="goReceipt"
              >
                {{ current.receiptOrderUid.slice(0, 8) }}…
              </el-button>
              <span v-else>—</span>
            </el-descriptions-item>
          </el-descriptions>

          <div class="flex flex-wrap gap-2">
            <Auth value="patch/service-work-order">
              <el-button size="small" @click="saveNotes">保存信息</el-button>
            </Auth>
            <Auth
              v-for="st in nextStatuses"
              :key="st"
              value="patch/service-work-order"
            >
              <el-button
                size="small"
                type="primary"
                plain
                @click="changeStatus(st)"
              >
                → {{ STATUS_LABEL[st] }}
              </el-button>
            </Auth>
            <Auth value="post/service-work-order/convert">
              <el-button
                size="small"
                type="success"
                :disabled="!!current.saleOrderUid"
                @click="generateSaleOrder"
              >
                生成销售单
              </el-button>
            </Auth>
          </div>

          <el-form label-width="88px" size="small">
            <el-form-item label="检测备注">
              <el-input
                v-model="current.inspectionNotes"
                type="textarea"
                :rows="2"
                :disabled="!editable"
              />
            </el-form-item>
            <el-form-item label="报价备注">
              <el-input
                v-model="current.quoteNotes"
                type="textarea"
                :rows="2"
                :disabled="!editable"
              />
            </el-form-item>
          </el-form>

          <div>
            <div class="mb-2 font-medium">工单行</div>
            <el-table :data="current.lines || []" border size="small">
              <el-table-column prop="lineType" label="类型" width="90" />
              <el-table-column label="商品" min-width="140">
                <template #default="{ row }">
                  {{ row.tireName || row.tireId || row.packageUid || "—" }}
                </template>
              </el-table-column>
              <el-table-column prop="qty" label="数量" width="70" />
              <el-table-column label="单价" width="100">
                <template #default="{ row }">
                  {{ formatMoneyFromFen(row.unitPrice) }}
                </template>
              </el-table-column>
              <el-table-column label="小计" width="100">
                <template #default="{ row }">
                  {{ lineAmount(row) }}
                </template>
              </el-table-column>
              <el-table-column v-if="editable" label="操作" width="80">
                <template #default="{ row }">
                  <el-button link type="danger" @click="removeLine(row.uid)">
                    删
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="editable" class="mt-3 flex flex-wrap items-center gap-2">
              <el-select v-model="lineForm.lineType" class="w-[110px]">
                <el-option label="商品" value="TIRE" />
                <el-option label="服务" value="SERVICE" />
                <el-option label="套餐" value="PACKAGE" />
              </el-select>
              <el-select
                v-if="lineForm.lineType === 'PACKAGE'"
                v-model="lineForm.packageUid"
                filterable
                placeholder="选择套餐"
                class="w-[200px]"
              >
                <el-option
                  v-for="p in packageOptions"
                  :key="p.uid"
                  :label="p.name"
                  :value="p.uid"
                />
              </el-select>
              <el-select
                v-else
                v-model="lineForm.tireId"
                filterable
                placeholder="选择商品"
                class="w-[200px]"
              >
                <el-option
                  v-for="t in tireOptions"
                  :key="t.uid"
                  :label="t.name"
                  :value="t.uid"
                />
              </el-select>
              <el-input-number v-model="lineForm.qty" :min="1" />
              <el-input-number
                v-if="lineForm.lineType !== 'PACKAGE'"
                v-model="lineForm.unitPriceYuan"
                :min="0"
                :precision="2"
                placeholder="单价(元)"
              />
              <Auth value="post/service-work-order">
                <el-button type="primary" @click="addLine">添加</el-button>
              </Auth>
            </div>
          </div>

          <div class="border-t pt-3">
            <div class="mb-2 font-medium">收银（生成收款单）</div>
            <div class="flex flex-wrap items-center gap-2">
              <el-select
                v-model="checkoutForm.paymentId"
                clearable
                filterable
                placeholder="收款账户（可空=默认）"
                class="w-[220px]"
              >
                <el-option
                  v-for="p in paymentOptions"
                  :key="p.uid"
                  :label="p.name"
                  :value="p.uid"
                />
              </el-select>
              <el-input
                v-model="checkoutForm.paymentMethod"
                placeholder="收款方式"
                class="w-[140px]"
              />
              <Auth value="post/service-work-order/checkout">
                <el-button
                  type="warning"
                  :disabled="!current.saleOrderUid"
                  @click="checkout"
                >
                  收银
                </el-button>
              </Auth>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              需先生成销售单；收银仅创建草稿收款单核销正式应收，不新建支付网关。
            </p>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>
