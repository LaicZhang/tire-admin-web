<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getRepoListApi } from "@/api/company/repo";
import { getReserveListApi, batchStockTakingApi } from "@/api/business/reserve";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Check from "~icons/ep/check";

defineOptions({
  name: "BusinessStockTaking"
});

const loading = ref(false);
const repoList = ref<any[]>([]);
const currentRepo = ref<string | undefined>(undefined);
const tableData = ref<any[]>([]);

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
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
  // 找出有差异的或者所有行？通常只提交有差异的，或者全量提交。API设计是 batchStockTakingApi
  // 假设提交所有行
  const items = tableData.value.map(item => ({
    repoId: item.repoId || currentRepo.value, // 确保有repoId
    tireId: item.tireId,
    actualCount: item.actualCount,
    desc: item.description
  }));

  try {
    await batchStockTakingApi({ items });
    message("盘点提交成功", { type: "success" });
    loadData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "提交失败";
    message(msg, { type: "error" });
  }
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
