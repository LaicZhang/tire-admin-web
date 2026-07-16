<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";
import {
  approveSpecialPriceRequestApi,
  createSpecialPriceRequestApi,
  getSpecialPriceRequestsApi,
  rejectSpecialPriceRequestApi,
  type SpecialPriceRequest,
  type SpecialPriceRequestStatus
} from "@/api/business/special-price";

defineOptions({ name: "SpecialPriceManagement" });

const loading = ref(false);
const rows = ref<SpecialPriceRequest[]>([]);
const page = reactive({ current: 1, total: 0, pageSize: 20 });
const filters = reactive<{ status?: SpecialPriceRequestStatus }>({});
const form = reactive({
  customerId: "",
  tireId: "",
  quantity: 1,
  requestedPrice: 0,
  reason: "",
  expiresAt: ""
});

const statusText: Record<SpecialPriceRequestStatus, string> = {
  PENDING_APPROVAL: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  USED: "已使用",
  CANCELLED: "已取消"
};

function money(value: string) {
  return formatMoneyFromFen(BigInt(value));
}

function specialPriceStatusText(row: unknown) {
  if (!row || typeof row !== "object" || !("status" in row)) return "-";
  const status = row.status;
  if (typeof status !== "string" || !(status in statusText)) return status;
  return statusText[status as SpecialPriceRequestStatus];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getSpecialPriceRequestsApi(page.current, {
      status: filters.status
    });
    rows.value = res.data?.list ?? [];
    page.total = res.data?.count ?? 0;
    page.pageSize = res.data?.pageSize ?? 20;
  } finally {
    loading.value = false;
  }
}

async function createRequest() {
  if (!form.customerId.trim() || !form.tireId.trim() || !form.reason.trim()) {
    message("客户、商品和申请原因不能为空", { type: "warning" });
    return;
  }
  await createSpecialPriceRequestApi({
    customerId: form.customerId.trim(),
    tireId: form.tireId.trim(),
    quantity: form.quantity,
    requestedPrice: form.requestedPrice,
    reason: form.reason.trim(),
    expiresAt: form.expiresAt || undefined
  });
  message("特价申请已提交", { type: "success" });
  form.reason = "";
  await loadData();
}

function requestUid(row: unknown) {
  if (
    !row ||
    typeof row !== "object" ||
    !("uid" in row) ||
    typeof row.uid !== "string"
  ) {
    throw new Error("特价申请 UID 缺失");
  }
  return row.uid;
}

async function approve(row: unknown) {
  const uid = requestUid(row);
  await ElMessageBox.confirm("确认通过该特价申请？", "审核特价");
  await approveSpecialPriceRequestApi(uid);
  message("特价申请已通过", { type: "success" });
  await loadData();
}

async function reject(row: unknown) {
  const uid = requestUid(row);
  const result = await ElMessageBox.prompt("请输入驳回原因", "驳回特价", {
    inputValidator: value => Boolean(value?.trim()) || "驳回原因不能为空"
  });
  await rejectSpecialPriceRequestApi(uid, result.value.trim());
  message("特价申请已驳回", { type: "success" });
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="main">
    <el-card class="mb-3">
      <template #header>新建特价申请</template>
      <el-form inline>
        <el-form-item label="客户 UID">
          <el-input v-model="form.customerId" class="w-[240px]" />
        </el-form-item>
        <el-form-item label="商品 UID">
          <el-input v-model="form.tireId" class="w-[240px]" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="申请单价（分）">
          <el-input-number v-model="form.requestedPrice" :min="0" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="form.expiresAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" class="w-[280px]" />
        </el-form-item>
        <el-form-item>
          <Auth value="post/special-price-request">
            <el-button type="primary" @click="createRequest"
              >提交申请</el-button
            >
          </Auth>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable class="w-[150px]">
            <el-option label="待审核" value="PENDING_APPROVAL" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已使用" value="USED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="
              page.current = 1;
              loadData();
            "
          >
            查询
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="createdAt" label="申请时间" min-width="180" />
        <el-table-column prop="customerId" label="客户 UID" min-width="220" />
        <el-table-column prop="tireId" label="商品 UID" min-width="220" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="基准价" width="120">
          <template #default="{ row }"
            >¥{{ money(row.baselinePrice) }}</template
          >
        </el-table-column>
        <el-table-column label="申请价" width="120">
          <template #default="{ row }"
            >¥{{ money(row.requestedPrice) }}</template
          >
        </el-table-column>
        <el-table-column label="差额" width="120">
          <template #default="{ row }"
            >¥{{ money(row.differenceAmount) }}</template
          >
        </el-table-column>
        <el-table-column prop="reason" label="申请原因" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{
            specialPriceStatusText(row)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING_APPROVAL'">
              <Auth value="post/special-price-request/:uid/approve">
                <el-button link type="primary" @click="approve(row)"
                  >通过</el-button
                >
              </Auth>
              <Auth value="post/special-price-request/:uid/reject">
                <el-button link type="danger" @click="reject(row)"
                  >驳回</el-button
                >
              </Auth>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.current"
        class="mt-3 justify-end"
        :page-size="page.pageSize"
        :total="page.total"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>
