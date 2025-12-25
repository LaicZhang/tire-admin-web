<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRepoListApi } from "@/api/company/repo";
import { getReserveListApi, batchStockTakingApi } from "@/api/business/reserve";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Check from "~icons/ep/check";
import Plus from "~icons/ep/plus";
import Minus from "~icons/ep/minus";
import Document from "~icons/ep/document";

defineOptions({
  name: "BusinessStockTaking"
});

const router = useRouter();
const loading = ref(false);
const repoList = ref<any[]>([]);
const currentRepo = ref<string | undefined>(undefined);
const tableData = ref<any[]>([]);
const lastStockTakingResult = ref<any[]>([]);
const showResultSummary = ref(false);

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 计算盘点差异汇总
const stockTakingSummary = computed(() => {
  const surplus = tableData.value.filter(item => item.actualCount > item.count);
  const waste = tableData.value.filter(item => item.actualCount < item.count);
  const unchanged = tableData.value.filter(
    item => item.actualCount === item.count
  );

  return {
    total: tableData.value.length,
    surplusCount: surplus.length,
    surplusQty: surplus.reduce(
      (sum, item) => sum + (item.actualCount - item.count),
      0
    ),
    wasteCount: waste.length,
    wasteQty: waste.reduce(
      (sum, item) => sum + (item.count - item.actualCount),
      0
    ),
    unchangedCount: unchanged.length
  };
});

const getRepos = async () => {
  try {
    const { data, code } = await getRepoListApi(1, { limit: 100 });
    if (code === 200) {
      repoList.value = Array.isArray(data) ? data : data.list || [];
      if (repoList.value.length && !currentRepo.value) {
        currentRepo.value = repoList.value[0].uid;
        loadData();
      }
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
  }
};

const loadData = async () => {
  if (!currentRepo.value) return;
  loading.value = true;
  showResultSummary.value = false;
  try {
    const { data, code } = await getReserveListApi(
      pagination.value.currentPage,
      {
        limit: pagination.value.pageSize,
        repoId: currentRepo.value
      }
    );
    if (code === 200 && data) {
      const list = Array.isArray(data) ? data : data.list || [];
      pagination.value.total = Array.isArray(data)
        ? data.length
        : data.total || 0;

      // 添加盘点字段
      tableData.value = list.map((item: any) => ({
        ...item,
        actualCount: item.count, // 默认实盘数量等于账面数量
        description: ""
      }));
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载库存数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  const itemsWithDifference = tableData.value.filter(
    item => item.actualCount !== item.count
  );

  if (itemsWithDifference.length === 0) {
    message("没有需要调整的库存差异", { type: "info" });
    return;
  }

  const items = itemsWithDifference.map(item => ({
    repoId: item.repoId || currentRepo.value,
    tireId: item.tireId,
    actualCount: item.actualCount,
    desc: item.description
  }));

  try {
    const { data } = await batchStockTakingApi({ items });
    message("盘点提交成功", { type: "success" });
    lastStockTakingResult.value = data || [];
    showResultSummary.value = true;
    loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "提交失败";
    message(msg, { type: "error" });
  }
};

// 跳转到盘盈单创建页面
const handleCreateSurplusOrder = () => {
  const surplusItems = tableData.value.filter(
    item => item.actualCount > item.count
  );
  if (surplusItems.length === 0) {
    message("没有盘盈商品", { type: "warning" });
    return;
  }
  // 存储盘盈数据到sessionStorage供盘盈单页面使用
  sessionStorage.setItem(
    "stockTakingSurplus",
    JSON.stringify(
      surplusItems.map(item => ({
        repoId: item.repoId || currentRepo.value,
        tireId: item.tireId,
        tireName: item.tire?.name || item.tireName,
        count: item.actualCount - item.count
      }))
    )
  );
  router.push("/business/surplus");
};

// 跳转到盘亏单创建页面
const handleCreateWasteOrder = () => {
  const wasteItems = tableData.value.filter(
    item => item.actualCount < item.count
  );
  if (wasteItems.length === 0) {
    message("没有盘亏商品", { type: "warning" });
    return;
  }
  // 存储盘亏数据到sessionStorage供盘亏单页面使用
  sessionStorage.setItem(
    "stockTakingWaste",
    JSON.stringify(
      wasteItems.map(item => ({
        repoId: item.repoId || currentRepo.value,
        tireId: item.tireId,
        tireName: item.tire?.name || item.tireName,
        count: item.count - item.actualCount
      }))
    )
  );
  router.push("/business/waste");
};

const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val;
  loadData();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  loadData();
};

onMounted(() => {
  getRepos();
});
</script>

<template>
  <div class="main p-4">
    <!-- 操作栏 -->
    <el-card class="mb-4">
      <div class="flex items-center space-x-4">
        <label>选择仓库：</label>
        <el-select
          v-model="currentRepo"
          placeholder="请选择仓库"
          class="w-60"
          @change="loadData"
        >
          <el-option
            v-for="item in repoList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="loadData"
        >
          查询
        </el-button>
        <div class="flex-grow" />
        <el-button
          type="success"
          :icon="useRenderIcon(Check)"
          :disabled="!tableData.length"
          @click="handleSubmit"
        >
          提交盘点
        </el-button>
      </div>
    </el-card>

    <!-- 盘点差异汇总 -->
    <el-card v-if="tableData.length" class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">盘点差异汇总</span>
          <div class="flex space-x-2">
            <el-button
              v-if="stockTakingSummary.surplusCount > 0"
              type="success"
              size="small"
              :icon="useRenderIcon(Plus)"
              @click="handleCreateSurplusOrder"
            >
              生成盘盈单 ({{ stockTakingSummary.surplusCount }}项)
            </el-button>
            <el-button
              v-if="stockTakingSummary.wasteCount > 0"
              type="danger"
              size="small"
              :icon="useRenderIcon(Minus)"
              @click="handleCreateWasteOrder"
            >
              生成盘亏单 ({{ stockTakingSummary.wasteCount }}项)
            </el-button>
          </div>
        </div>
      </template>
      <div class="grid grid-cols-5 gap-4 text-center">
        <div class="p-3 bg-gray-50 rounded">
          <div class="text-2xl font-bold text-gray-600">
            {{ stockTakingSummary.total }}
          </div>
          <div class="text-sm text-gray-500">盘点商品</div>
        </div>
        <div class="p-3 bg-green-50 rounded">
          <div class="text-2xl font-bold text-green-600">
            {{ stockTakingSummary.surplusCount }}
          </div>
          <div class="text-sm text-gray-500">盘盈品项</div>
        </div>
        <div class="p-3 bg-green-50 rounded">
          <div class="text-2xl font-bold text-green-600">
            +{{ stockTakingSummary.surplusQty }}
          </div>
          <div class="text-sm text-gray-500">盘盈数量</div>
        </div>
        <div class="p-3 bg-red-50 rounded">
          <div class="text-2xl font-bold text-red-600">
            {{ stockTakingSummary.wasteCount }}
          </div>
          <div class="text-sm text-gray-500">盘亏品项</div>
        </div>
        <div class="p-3 bg-red-50 rounded">
          <div class="text-2xl font-bold text-red-600">
            -{{ stockTakingSummary.wasteQty }}
          </div>
          <div class="text-sm text-gray-500">盘亏数量</div>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table v-loading="loading" :data="tableData" stripe border>
        <el-table-column prop="tireName" label="商品名称" min-width="150">
          <template #default="{ row }">
            <span>{{ row.tire?.name || row.tireName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tireSpec" label="规格" width="120">
          <template #default="{ row }">
            <span>{{ row.tire?.spec || row.tireSpec }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="count"
          label="账面数量"
          width="100"
          align="center"
        />
        <el-table-column label="实盘数量" width="150" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.actualCount"
              :min="0"
              :step="1"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="盘盈/盘亏" width="100" align="center">
          <template #default="{ row }">
            <span
              :class="{
                'text-green-500': row.actualCount > row.count,
                'text-red-500': row.actualCount < row.count,
                'text-gray-400': row.actualCount === row.count
              }"
            >
              {{ row.actualCount - row.count }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.description"
              placeholder="差异说明"
              size="small"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>
