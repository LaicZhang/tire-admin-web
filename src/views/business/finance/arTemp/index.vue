<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getSaleDeliverySources,
  type SaleDeliverySource
} from "@/api/business/invoice";
import { handleApiError } from "@/utils/error";
import { formatMoneyFromFen } from "@/utils/formatMoney";

defineOptions({
  name: "FinanceArTempList"
});

const router = useRouter();
const loading = ref(false);
const dataList = ref<SaleDeliverySource[]>([]);
const keyword = ref("");

const filteredList = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return dataList.value;
  return dataList.value.filter(item =>
    [item.deliveryNoteNo, item.customerName].some(value =>
      String(value || "")
        .toLowerCase()
        .includes(text)
    )
  );
});

function calcAgeDays(shippedAt: string) {
  const diff = Date.now() - new Date(shippedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getSaleDeliverySources();
    dataList.value = data || [];
  } catch (error) {
    handleApiError(error, "加载发货暂估应收失败");
  } finally {
    loading.value = false;
  }
}

function goCreateInvoice(row: SaleDeliverySource) {
  router.push({
    path: "/finance/invoice",
    query: {
      autoCreate: "1",
      businessType: "SALE",
      deliveryNoteId: row.uid
    }
  });
}

loadList();
</script>

<template>
  <div class="main">
    <el-card>
      <div class="mb-4 flex items-center gap-3">
        <el-input v-model="keyword" clearable placeholder="搜索发货单号/客户" />
        <el-button :loading="loading" @click="loadList">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border>
        <el-table-column
          prop="deliveryNoteNo"
          label="发货单号"
          min-width="160"
        />
        <el-table-column prop="customerName" label="客户" min-width="180" />
        <el-table-column label="发货日期" min-width="120">
          <template #default="{ row }">
            {{ row.shippedAt.slice(0, 10) }}
          </template>
        </el-table-column>
        <el-table-column label="账龄(天)" min-width="100">
          <template #default="{ row }">
            {{ calcAgeDays(row.shippedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="暂估金额" min-width="120">
          <template #default="{ row }">
            {{ formatMoneyFromFen(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="已开票" min-width="120">
          <template #default="{ row }">
            {{ formatMoneyFromFen(row.invoicedAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="剩余未开票" min-width="140">
          <template #default="{ row }">
            {{ formatMoneyFromFen(row.remainingAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="发货行余额" min-width="340">
          <template #default="{ row }">
            <div class="space-y-1">
              <div v-for="line in row.lines" :key="line.uid" class="text-xs">
                {{ line.uid.slice(0, 8) }} · 数量 {{ line.remainingQuantity }} ·
                {{ formatMoneyFromFen(line.remainingAmount) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="goCreateInvoice(row)">
              去开票
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
