<script setup lang="ts">
import { ref } from "vue";
import {
  getSalePickingDetailApi,
  getSalePickingPageApi,
  postSalePickingApi,
  type SalePickingApi
} from "@/api/business/order";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";

defineOptions({
  name: "FinanceSalePickingList"
});

const loading = ref(false);
const operatingUid = ref("");
const dataList = ref<SalePickingApi[]>([]);
const detailVisible = ref(false);
const currentDetail = ref<SalePickingApi | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getSalePickingPageApi(1);
    dataList.value = data?.list || [];
  } catch (error) {
    handleApiError(error, "加载拣货单失败");
  } finally {
    loading.value = false;
  }
}

async function openDetail(uid: string) {
  try {
    const { data } = await getSalePickingDetailApi(uid);
    currentDetail.value = data || null;
    detailVisible.value = true;
  } catch (error) {
    handleApiError(error, "加载拣货单详情失败");
  }
}

async function handlePost(row: SalePickingApi) {
  operatingUid.value = row.uid;
  try {
    await postSalePickingApi(row.uid);
    message("拣货单已过账", { type: "success" });
    await loadList();
  } catch (error) {
    handleApiError(error, "拣货过账失败");
  } finally {
    operatingUid.value = "";
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
        <el-table-column prop="pickingNo" label="拣货单号" min-width="180" />
        <el-table-column prop="status" label="状态" min-width="120" />
        <el-table-column
          prop="saleAllocationUid"
          label="分配单"
          min-width="180"
        />
        <el-table-column label="拣货行" min-width="320">
          <template #default="{ row }">
            <div class="space-y-1">
              <div v-for="line in row.lines" :key="line.uid" class="text-xs">
                {{ line.saleOrderDetailUid }} · 数量 {{ line.pickedQuantity }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.uid)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'PICKED' || row.status === 'VERIFIED'"
              link
              type="success"
              :loading="operatingUid === row.uid"
              @click="handlePost(row)"
            >
              过账
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="detailVisible" title="拣货单详情" size="720px">
      <template v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="拣货单号">
            {{ currentDetail.pickingNo }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            {{ currentDetail.status }}
          </el-descriptions-item>
          <el-descriptions-item label="销售单">
            {{ currentDetail.saleOrderUid }}
          </el-descriptions-item>
          <el-descriptions-item label="分配单">
            {{ currentDetail.saleAllocationUid }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">拣货行</el-divider>
        <el-table :data="currentDetail.lines" border>
          <el-table-column prop="uid" label="行 UID" min-width="180" />
          <el-table-column
            prop="saleOrderDetailUid"
            label="销售行"
            min-width="180"
          />
          <el-table-column
            prop="pickedQuantity"
            label="拣货数量"
            min-width="100"
          />
          <el-table-column label="序列号" min-width="220">
            <template #default="{ row }">
              {{ (row.serialNos || []).join("、") || "-" }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>
