<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Check from "~icons/ep/check";
import Plus from "~icons/ep/plus";
import Minus from "~icons/ep/minus";
import List from "~icons/ep/list";
import Close from "~icons/ep/close";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { useRepoSelector } from "./composables/useRepoSelector";
import { useQuickStockTaking } from "./composables/useQuickStockTaking";
import { useStockTakingTasks } from "./composables/useStockTakingTasks";
import { calculateStockTakingSummary } from "./utils";
import {
  quickStockColumns,
  taskDetailColumns,
  taskListColumns
} from "./columns";
import CreateTaskDialog from "./components/CreateTaskDialog.vue";

defineOptions({
  name: "BusinessStockTaking"
});

const router = useRouter();
const activeTab = ref<"quick" | "task">("quick");

// 仓库选择
const { repoList, currentRepo, getRepos } = useRepoSelector();

// 快速盘点
const {
  loading: quickLoading,
  tableData,
  showResultSummary,
  quickPagination,
  stockTakingSummary: quickSummary,
  loadData,
  handleSubmit,
  handleSizeChange,
  handleCurrentChange
} = useQuickStockTaking(currentRepo);

// 盘点任务
const {
  loading: taskLoading,
  taskList,
  currentTask,
  showCreateTaskDialog,
  newTaskForm,
  taskPagination,
  loadTaskList,
  handleCreateTask,
  handleViewTask,
  handleSaveDetails,
  handleCompleteTask,
  handleCancelTask,
  handleBackToList,
  handleCreateSurplusOrder: taskCreateSurplus,
  handleCreateWasteOrder: taskCreateWaste
} = useStockTakingTasks(currentRepo);

const loading = computed(() => quickLoading.value || taskLoading.value);

// 任务模式的汇总
const taskSummary = computed(() => {
  if (!currentTask.value) return null;
  return calculateStockTakingSummary(currentTask.value.details || []);
});

// 快速盘点的盘盈盘亏处理
const handleCreateSurplusOrder = () => {
  const surplusItems = tableData.value.filter(
    item => item.actualCount > item.count
  );
  if (surplusItems.length === 0) {
    return;
  }
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

const handleCreateWasteOrder = () => {
  const wasteItems = tableData.value.filter(
    item => item.actualCount < item.count
  );
  if (wasteItems.length === 0) {
    return;
  }
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

const handleTabChange = (tab: string | number | boolean | undefined) => {
  if (tab === "task") {
    loadTaskList();
  }
};

const taskStatusMap = {
  IN_PROGRESS: { label: "进行中", type: "warning" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "info" }
} as const;

// 监听仓库变化
watch(currentRepo, () => {
  if (activeTab.value === "quick") {
    loadData();
  } else {
    loadTaskList();
  }
});

onMounted(() => {
  getRepos().then(() => {
    if (currentRepo.value && activeTab.value === "quick") {
      loadData();
    }
  });
});
</script>

<template>
  <div class="main p-4">
    <!-- 操作栏 -->
    <el-card class="mb-4">
      <div class="flex items-center space-x-4">
        <label>选择仓库：</label>
        <el-select v-model="currentRepo" placeholder="请选择仓库" class="w-60">
          <el-option
            v-for="item in repoList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
        <el-radio-group v-model="activeTab" @change="handleTabChange">
          <el-radio-button value="quick">快速盘点</el-radio-button>
          <el-radio-button value="task">盘点任务</el-radio-button>
        </el-radio-group>
        <div class="grow" />
        <el-button
          v-if="activeTab === 'task' && !currentTask"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="showCreateTaskDialog = true"
        >
          创建盘点任务
        </el-button>
        <el-button
          v-if="activeTab === 'quick'"
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="loadData"
        >
          查询
        </el-button>
        <el-button
          v-if="activeTab === 'quick'"
          type="success"
          :icon="useRenderIcon(Check)"
          :disabled="!tableData.length"
          @click="handleSubmit"
        >
          提交盘点
        </el-button>
      </div>
    </el-card>

    <!-- 快速盘点模式 -->
    <template v-if="activeTab === 'quick'">
      <!-- 盘点差异汇总 -->
      <el-card v-if="tableData.length" class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-bold">盘点差异汇总</span>
            <div class="flex space-x-2">
              <el-button
                v-if="quickSummary.surplusCount > 0"
                type="success"
                size="small"
                :icon="useRenderIcon(Plus)"
                @click="handleCreateSurplusOrder"
              >
                生成盘盈单 ({{ quickSummary.surplusCount }}项)
              </el-button>
              <el-button
                v-if="quickSummary.wasteCount > 0"
                type="danger"
                size="small"
                :icon="useRenderIcon(Minus)"
                @click="handleCreateWasteOrder"
              >
                生成盘亏单 ({{ quickSummary.wasteCount }}项)
              </el-button>
            </div>
          </div>
        </template>
        <div class="grid grid-cols-5 gap-4 text-center">
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-2xl font-bold text-gray-600">
              {{ quickSummary.total }}
            </div>
            <div class="text-sm text-gray-500">盘点商品</div>
          </div>
          <div class="p-3 bg-green-50 rounded">
            <div class="text-2xl font-bold text-green-600">
              {{ quickSummary.surplusCount }}
            </div>
            <div class="text-sm text-gray-500">盘盈品项</div>
          </div>
          <div class="p-3 bg-green-50 rounded">
            <div class="text-2xl font-bold text-green-600">
              +{{ quickSummary.surplusQty }}
            </div>
            <div class="text-sm text-gray-500">盘盈数量</div>
          </div>
          <div class="p-3 bg-red-50 rounded">
            <div class="text-2xl font-bold text-red-600">
              {{ quickSummary.wasteCount }}
            </div>
            <div class="text-sm text-gray-500">盘亏品项</div>
          </div>
          <div class="p-3 bg-red-50 rounded">
            <div class="text-2xl font-bold text-red-600">
              -{{ quickSummary.wasteQty }}
            </div>
            <div class="text-sm text-gray-500">盘亏数量</div>
          </div>
        </div>
      </el-card>

      <!-- 数据表格 -->
      <PureTableBar title="快速盘点" @refresh="loadData">
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            stripe
            align-whole="center"
            showOverflowTooltip
            table-layout="auto"
            :loading="quickLoading"
            :size="size"
            :columns="dynamicColumns"
            :data="tableData"
            :pagination="quickPagination"
            :paginationSmall="size === 'small'"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #actualCount="{ row }">
              <el-input-number
                v-model="row.actualCount"
                :min="0"
                :step="1"
                size="small"
              />
            </template>
            <template #difference="{ row }">
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
            <template #description="{ row }">
              <el-input
                v-model="row.description"
                placeholder="差异说明"
                size="small"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>

    <!-- 盘点任务模式 -->
    <template v-else-if="activeTab === 'task'">
      <!-- 任务详情 -->
      <template v-if="currentTask">
        <el-card class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <el-button
                  text
                  :icon="useRenderIcon(List)"
                  @click="handleBackToList"
                >
                  返回列表
                </el-button>
                <span class="font-bold text-lg">{{ currentTask.name }}</span>
                <StatusTag
                  :status="currentTask.status"
                  :status-map="taskStatusMap"
                  size="default"
                />
              </div>
              <div
                v-if="currentTask.status === 'IN_PROGRESS'"
                class="flex space-x-2"
              >
                <el-button
                  type="primary"
                  :icon="useRenderIcon(Check)"
                  @click="handleSaveDetails"
                >
                  保存
                </el-button>
                <el-button type="success" @click="handleCompleteTask">
                  完成盘点
                </el-button>
                <el-button
                  type="danger"
                  plain
                  :icon="useRenderIcon(Close)"
                  @click="handleCancelTask"
                >
                  取消任务
                </el-button>
              </div>
            </div>
          </template>

          <!-- 任务信息 -->
          <div class="mb-4 text-sm text-gray-500 space-x-6">
            <span>仓库：{{ currentTask.repo?.name }}</span>
            <span
              >创建时间：{{
                new Date(currentTask.createdAt).toLocaleString()
              }}</span
            >
            <span v-if="currentTask.completedAt"
              >完成时间：{{
                new Date(currentTask.completedAt).toLocaleString()
              }}</span
            >
          </div>

          <!-- 盘点差异汇总 -->
          <div
            v-if="taskSummary"
            class="grid grid-cols-5 gap-4 text-center mb-4"
          >
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-2xl font-bold text-gray-600">
                {{ taskSummary.total }}
              </div>
              <div class="text-sm text-gray-500">盘点商品</div>
            </div>
            <div class="p-3 bg-green-50 rounded">
              <div class="text-2xl font-bold text-green-600">
                {{ taskSummary.surplusCount }}
              </div>
              <div class="text-sm text-gray-500">盘盈品项</div>
            </div>
            <div class="p-3 bg-green-50 rounded">
              <div class="text-2xl font-bold text-green-600">
                +{{ taskSummary.surplusQty }}
              </div>
              <div class="text-sm text-gray-500">盘盈数量</div>
            </div>
            <div class="p-3 bg-red-50 rounded">
              <div class="text-2xl font-bold text-red-600">
                {{ taskSummary.wasteCount }}
              </div>
              <div class="text-sm text-gray-500">盘亏品项</div>
            </div>
            <div class="p-3 bg-red-50 rounded">
              <div class="text-2xl font-bold text-red-600">
                -{{ taskSummary.wasteQty }}
              </div>
              <div class="text-sm text-gray-500">盘亏数量</div>
            </div>
          </div>

          <!-- 盘点明细表格 -->
          <pure-table
            :loading="taskLoading"
            :data="currentTask.details"
            :columns="taskDetailColumns"
            stripe
            border
          >
            <template #actualCount="{ row }">
              <el-input-number
                v-if="currentTask?.status === 'IN_PROGRESS'"
                v-model="row.actualCount"
                :min="0"
                :step="1"
                size="small"
              />
              <span v-else>{{ row.actualCount ?? "-" }}</span>
            </template>
            <template #difference="{ row }">
              <span
                v-if="row.actualCount !== null && row.actualCount !== undefined"
                :class="{
                  'text-green-500': row.actualCount > row.bookCount,
                  'text-red-500': row.actualCount < row.bookCount,
                  'text-gray-400': row.actualCount === row.bookCount
                }"
              >
                {{ row.actualCount - row.bookCount }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
            <template #remark="{ row }">
              <el-input
                v-if="currentTask?.status === 'IN_PROGRESS'"
                v-model="row.remark"
                placeholder="差异说明"
                size="small"
              />
              <span v-else>{{ row.remark || "-" }}</span>
            </template>
          </pure-table>
        </el-card>
      </template>

      <!-- 任务列表 -->
      <template v-else>
        <PureTableBar title="盘点任务列表" @refresh="loadTaskList">
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              border
              stripe
              align-whole="center"
              showOverflowTooltip
              table-layout="auto"
              :loading="taskLoading"
              :size="size"
              :columns="dynamicColumns"
              :data="taskList"
              :pagination="taskPagination"
              :paginationSmall="size === 'small'"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="loadTaskList"
              @page-current-change="loadTaskList"
            >
              <template #operation="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  text
                  @click="handleViewTask(row)"
                >
                  {{ row.status === "IN_PROGRESS" ? "继续盘点" : "查看详情" }}
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </template>
    </template>

    <!-- 创建盘点任务弹窗 -->
    <CreateTaskDialog
      v-model:visible="showCreateTaskDialog"
      v-model:form="newTaskForm"
      :loading="taskLoading"
      @submit="handleCreateTask"
    />
  </div>
</template>
