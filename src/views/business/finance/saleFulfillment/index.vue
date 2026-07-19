<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  confirmSaleAllocationApi,
  createSalePickingFromAllocationApi,
  getSaleFulfillmentWorkbenchApi,
  postSalePickingApi,
  type SaleFulfillmentWorkbenchItem
} from "@/api/business/order";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";

defineOptions({
  name: "FinanceSaleFulfillmentWorkbench"
});

const router = useRouter();
const loading = ref(false);
const actingUid = ref<string | null>(null);
const dataList = ref<SaleFulfillmentWorkbenchItem[]>([]);

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getSaleFulfillmentWorkbenchApi(50);
    dataList.value = Array.isArray(data) ? data : [];
  } catch (error) {
    handleApiError(error, "加载履约工作台失败");
  } finally {
    loading.value = false;
  }
}

/**
 * BIZ-006: one preferred next action per order.
 * CREATE_ALLOCATION needs line payload → open sales order page.
 * CONFIRM_PICKING needs pick qty payload → open picking workbench.
 */
async function runNext(row: unknown) {
  const item = row as SaleFulfillmentWorkbenchItem;
  return runNextItem(item);
}

async function runNextItem(row: SaleFulfillmentWorkbenchItem) {
  if (
    !row.nextAction ||
    row.nextAction === "DONE" ||
    row.nextAction === "REVERSED"
  ) {
    return;
  }
  actingUid.value = row.saleOrderUid;
  try {
    switch (row.nextAction) {
      case "CREATE_ALLOCATION":
        await router.push({
          path: "/business/order",
          query: { highlight: row.saleOrderUid }
        });
        return;
      case "CONFIRM_ALLOCATION":
        if (!row.allocationUid) {
          message("缺少分配单", { type: "warning" });
          return;
        }
        await confirmSaleAllocationApi(row.allocationUid);
        message("已确认分配", { type: "success" });
        break;
      case "CREATE_PICKING":
        if (!row.allocationUid) {
          message("缺少分配单", { type: "warning" });
          return;
        }
        await createSalePickingFromAllocationApi(row.allocationUid);
        message("已创建拣货单", { type: "success" });
        break;
      case "CONFIRM_PICKING":
        await router.push({ path: "/finance/sale-picking" });
        return;
      case "POST_PICKING":
        if (!row.pickingUid) {
          message("缺少拣货单", { type: "warning" });
          return;
        }
        await postSalePickingApi(row.pickingUid);
        message("拣货已过账出库", { type: "success" });
        break;
      case "SHIP_OR_DONE":
        await router.push({ path: "/business/order" });
        return;
      default:
        message(row.nextActionLabel, { type: "info" });
        return;
    }
    await loadList();
  } catch (error) {
    handleApiError(error, "执行下一步失败");
  } finally {
    actingUid.value = null;
  }
}

loadList();
</script>

<template>
  <div class="main">
    <el-card>
      <div class="mb-4 flex items-center justify-between gap-2">
        <div class="text-sm text-gray-500">
          按销售单展示唯一下一步（分配 → 拣货 → 过账），避免双入口分叉
        </div>
        <el-button :loading="loading" @click="loadList">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border>
        <el-table-column prop="docNo" label="销售单号" min-width="160">
          <template #default="{ row }">
            {{ row.docNo || row.saleOrderUid }}
          </template>
        </el-table-column>
        <el-table-column prop="customerId" label="客户" min-width="140" />
        <el-table-column
          prop="nextActionLabel"
          label="下一步"
          min-width="120"
        />
        <el-table-column label="分配/拣货" min-width="200">
          <template #default="{ row }">
            <div class="text-xs text-gray-600">
              <div v-if="row.allocationUid">
                分配 {{ row.allocationStatus || "-" }}
              </div>
              <div v-if="row.pickingUid">
                拣货 {{ row.pickingStatus || "-" }}
              </div>
              <div v-if="!row.allocationUid && !row.pickingUid">—</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="120">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :loading="actingUid === row.saleOrderUid"
              :disabled="
                row.nextAction === 'DONE' ||
                row.nextAction === 'REVERSED' ||
                row.nextAction === 'AWAIT_APPROVAL'
              "
              @click="runNext(row)"
            >
              执行下一步
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
