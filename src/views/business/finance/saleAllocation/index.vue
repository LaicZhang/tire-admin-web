<script setup lang="ts">
import { ref } from "vue";
import {
  getSaleAllocationDetailApi,
  getSaleAllocationPageApi,
  type SaleAllocationApi
} from "@/api/business/order";
import { handleApiError } from "@/utils/error";

defineOptions({
  name: "FinanceSaleAllocationList"
});

const loading = ref(false);
const dataList = ref<SaleAllocationApi[]>([]);
const detailVisible = ref(false);
const currentDetail = ref<SaleAllocationApi | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getSaleAllocationPageApi(1);
    dataList.value = data?.list || [];
  } catch (error) {
    handleApiError(error, "加载分配单失败");
  } finally {
    loading.value = false;
  }
}

async function openDetail(uid: string) {
  try {
    const { data } = await getSaleAllocationDetailApi(uid);
    currentDetail.value = data || null;
    detailVisible.value = true;
  } catch (error) {
    handleApiError(error, "加载分配单详情失败");
  }
}

loadList();
</script>

<template>
  <div class="main">
    <el-card>
      <div class="mb-4 flex justify-end">
        <el-button :loading="loading" @click="loadList">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border>
        <el-table-column prop="allocationNo" label="分配单号" min-width="180" />
        <el-table-column prop="status" label="状态" min-width="120" />
        <el-table-column
          prop="totalQuantity"
          label="分配数量"
          min-width="120"
        />
        <el-table-column label="批次预占" min-width="320">
          <template #default="{ row }">
            <div class="space-y-1">
              <div
                v-for="item in row.reservationLines || []"
                :key="item.uid"
                class="text-xs"
              >
                {{ item.batchNo }} · 数量 {{ item.reservedQuantity }} ·
                {{ item.expiryDate ? item.expiryDate.slice(0, 10) : "无效期" }}
              </div>
              <div
                v-if="!(row.reservationLines || []).length"
                class="text-xs text-gray-400"
              >
                暂无预占明细
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.uid)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="detailVisible" title="分配单详情" size="720px">
      <template v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="分配单号">
            {{ currentDetail.allocationNo }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            {{ currentDetail.status }}
          </el-descriptions-item>
          <el-descriptions-item label="销售单">
            {{ currentDetail.saleOrderUid }}
          </el-descriptions-item>
          <el-descriptions-item label="分配数量">
            {{ currentDetail.totalQuantity }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">分配行</el-divider>
        <el-table :data="currentDetail.lines" border>
          <el-table-column prop="uid" label="行 UID" min-width="180" />
          <el-table-column
            prop="saleOrderDetailUid"
            label="销售行"
            min-width="180"
          />
          <el-table-column
            prop="allocatedQuantity"
            label="分配数量"
            min-width="120"
          />
        </el-table>

        <el-divider content-position="left">预占明细</el-divider>
        <el-table :data="currentDetail.reservationLines || []" border>
          <el-table-column prop="batchNo" label="批次" min-width="140" />
          <el-table-column
            prop="reservedQuantity"
            label="预占数量"
            min-width="100"
          />
          <el-table-column
            prop="consumedQuantity"
            label="已消费"
            min-width="100"
          />
          <el-table-column prop="status" label="状态" min-width="120" />
          <el-table-column label="效期" min-width="140">
            <template #default="{ row }">
              {{ row.expiryDate ? row.expiryDate.slice(0, 10) : "-" }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>
