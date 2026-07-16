<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Check from "~icons/ep/check";
import Plus from "~icons/ep/plus";
import List from "~icons/ep/list";
import Close from "~icons/ep/close";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { useRepoSelector } from "./composables/useRepoSelector";
import {
  getInventoryCheckSnapshotWarning,
  useStockTakingTasks
} from "./composables/useStockTakingTasks";
import { calculateStockTakingSummary } from "./utils";
import { taskDetailColumns, taskListColumns } from "./columns";
import CreateTaskDialog from "./components/CreateTaskDialog.vue";

defineOptions({
  name: "BusinessStockTaking"
});

// 仓库选择
const { repoList, currentRepo, getRepos } = useRepoSelector();

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
  handleBackToList
} = useStockTakingTasks(currentRepo);

// 任务模式的汇总
const taskSummary = computed(() => {
  if (!currentTask.value) return null;
  return calculateStockTakingSummary(currentTask.value.details || []);
});
const snapshotWarning = computed(() =>
  getInventoryCheckSnapshotWarning(currentTask.value)
);

const taskStatusMap = {
  IN_PROGRESS: { label: "进行中", type: "warning" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "info" }
} as const;

// 监听仓库变化
watch(currentRepo, () => {
  loadTaskList();
});

onMounted(() => {
  getRepos().then(() => {
    if (currentRepo.value) loadTaskList();
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
        <div class="grow" />
        <el-button
          v-if="!currentTask"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="showCreateTaskDialog = true"
        >
          创建盘点任务
        </el-button>
      </div>
    </el-card>

    <!-- 盘点任务模式 -->
    <template>
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
                  审核盘点
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

          <el-alert
            v-if="snapshotWarning"
            class="mb-4"
            type="warning"
            :closable="false"
            show-icon
            :title="snapshotWarning"
          />

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
              <el-tag
                v-if="row.snapshotInvalidated"
                class="mr-2"
                type="warning"
                size="small"
              >
                需重盘
              </el-tag>
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
