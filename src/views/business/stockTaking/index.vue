<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRepoListApi } from "@/api/company/repo";
import { getReserveListApi, batchStockTakingApi } from "@/api/business/reserve";
import {
  createInventoryCheckTaskApi,
  getInventoryCheckTasksApi,
  getInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi,
  completeInventoryCheckTaskApi,
  cancelInventoryCheckTaskApi,
  type InventoryCheckTask,
  type InventoryCheckDetail
} from "@/api/business/inventory-check";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Check from "~icons/ep/check";
import Plus from "~icons/ep/plus";
import Minus from "~icons/ep/minus";
import Document from "~icons/ep/document";
import Refresh from "~icons/ep/refresh";
import Close from "~icons/ep/close";
import List from "~icons/ep/list";

defineOptions({
  name: "BusinessStockTaking"
});

const router = useRouter();
const loading = ref(false);
const repoList = ref<any[]>([]);
const currentRepo = ref<string | undefined>(undefined);
const tableData = ref<any[]>([]);
const showResultSummary = ref(false);

// 盘点任务相关
const activeTab = ref<"quick" | "task">("quick");
const taskList = ref<InventoryCheckTask[]>([]);
const currentTask = ref<InventoryCheckTask | null>(null);
const showCreateTaskDialog = ref(false);
const newTaskForm = ref({
  name: "",
  remark: ""
});

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 任务分页
const taskPagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 计算盘点差异汇总
const stockTakingSummary = computed(() => {
  const data = currentTask.value
    ? currentTask.value.details || []
    : tableData.value;
  const surplus = data.filter(
    (item: any) =>
      (item.actualCount ?? item.bookCount) > (item.bookCount ?? item.count)
  );
  const waste = data.filter(
    (item: any) =>
      (item.actualCount ?? item.bookCount) < (item.bookCount ?? item.count)
  );
  const unchanged = data.filter(
    (item: any) =>
      (item.actualCount ?? item.bookCount) === (item.bookCount ?? item.count)
  );

  const getBookCount = (item: any) => item.bookCount ?? item.count;
  const getActualCount = (item: any) =>
    item.actualCount ?? item.bookCount ?? item.count;

  return {
    total: data.length,
    surplusCount: surplus.length,
    surplusQty: surplus.reduce(
      (sum: number, item: any) =>
        sum + (getActualCount(item) - getBookCount(item)),
      0
    ),
    wasteCount: waste.length,
    wasteQty: waste.reduce(
      (sum: number, item: any) =>
        sum + (getBookCount(item) - getActualCount(item)),
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

// 盘点任务列表
const loadTaskList = async () => {
  loading.value = true;
  try {
    const { data, code } = await getInventoryCheckTasksApi(
      taskPagination.value.currentPage,
      { repoId: currentRepo.value }
    );
    if (code === 200) {
      taskList.value = data.list || [];
      taskPagination.value.total = data.count || 0;
    }
  } catch (error) {
    message("加载盘点任务失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 创建盘点任务
const handleCreateTask = async () => {
  if (!currentRepo.value) {
    message("请先选择仓库", { type: "warning" });
    return;
  }

  try {
    loading.value = true;
    const { data, code } = await createInventoryCheckTaskApi({
      repoId: currentRepo.value,
      name: newTaskForm.value.name || undefined,
      remark: newTaskForm.value.remark || undefined
    });
    if (code === 200) {
      message("盘点任务创建成功", { type: "success" });
      showCreateTaskDialog.value = false;
      newTaskForm.value = { name: "", remark: "" };
      loadTaskList();
      // 直接进入任务详情
      handleViewTask(data);
    }
  } catch (error) {
    message("创建盘点任务失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 查看任务详情
const handleViewTask = async (task: InventoryCheckTask) => {
  loading.value = true;
  try {
    const { data, code } = await getInventoryCheckTaskApi(task.id);
    if (code === 200) {
      currentTask.value = data;
    }
  } catch (error) {
    message("加载任务详情失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 保存盘点明细
const handleSaveDetails = async () => {
  if (!currentTask.value) return;

  const updates = (currentTask.value.details || [])
    .filter(
      (d: InventoryCheckDetail) =>
        d.actualCount !== null && d.actualCount !== undefined
    )
    .map((d: InventoryCheckDetail) => ({
      detailId: d.id,
      actualCount: d.actualCount!,
      remark: d.remark
    }));

  if (updates.length === 0) {
    message("请先录入实盘数量", { type: "warning" });
    return;
  }

  try {
    loading.value = true;
    const { data, code } = await updateInventoryCheckDetailsApi(
      currentTask.value.id,
      { details: updates }
    );
    if (code === 200) {
      message("保存成功", { type: "success" });
      currentTask.value = data;
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 完成盘点任务
const handleCompleteTask = async () => {
  if (!currentTask.value) return;

  try {
    loading.value = true;
    const { data, code } = await completeInventoryCheckTaskApi(
      currentTask.value.id
    );
    if (code === 200) {
      message(
        "盘点完成！" +
          (data.surplusOrderId ? " 已生成盘盈单" : "") +
          (data.wasteOrderId ? " 已生成盘亏单" : ""),
        { type: "success" }
      );
      currentTask.value = data.task;
      loadTaskList();
    }
  } catch (error: any) {
    message(error?.message || "完成盘点失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 取消盘点任务
const handleCancelTask = async () => {
  if (!currentTask.value) return;

  try {
    loading.value = true;
    const { code } = await cancelInventoryCheckTaskApi(currentTask.value.id);
    if (code === 200) {
      message("盘点任务已取消", { type: "success" });
      currentTask.value = null;
      loadTaskList();
    }
  } catch (error) {
    message("取消失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 返回任务列表
const handleBackToList = () => {
  currentTask.value = null;
};

// 快速盘点提交
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

const handleTabChange = (tab: string) => {
  if (tab === "task") {
    loadTaskList();
  }
};

const getStatusType = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "info";
    default:
      return "info";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return "进行中";
    case "COMPLETED":
      return "已完成";
    case "CANCELLED":
      return "已取消";
    default:
      return status;
  }
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
          @change="activeTab === 'quick' ? loadData() : loadTaskList()"
        >
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
        <div class="flex-grow" />
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
                <el-tag :type="getStatusType(currentTask.status)">
                  {{ getStatusText(currentTask.status) }}
                </el-tag>
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
          <div class="grid grid-cols-5 gap-4 text-center mb-4">
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

          <!-- 盘点明细表格 -->
          <el-table
            v-loading="loading"
            :data="currentTask.details"
            stripe
            border
          >
            <el-table-column prop="tireName" label="商品名称" min-width="150" />
            <el-table-column
              prop="bookCount"
              label="账面数量"
              width="100"
              align="center"
            />
            <el-table-column label="实盘数量" width="150" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-if="currentTask?.status === 'IN_PROGRESS'"
                  v-model="row.actualCount"
                  :min="0"
                  :step="1"
                  size="small"
                />
                <span v-else>{{ row.actualCount ?? "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="盘盈/盘亏" width="100" align="center">
              <template #default="{ row }">
                <span
                  v-if="
                    row.actualCount !== null && row.actualCount !== undefined
                  "
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
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template #default="{ row }">
                <el-input
                  v-if="currentTask?.status === 'IN_PROGRESS'"
                  v-model="row.remark"
                  placeholder="差异说明"
                  size="small"
                />
                <span v-else>{{ row.remark || "-" }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </template>

      <!-- 任务列表 -->
      <template v-else>
        <el-card>
          <el-table v-loading="loading" :data="taskList" stripe border>
            <el-table-column prop="name" label="任务名称" min-width="200" />
            <el-table-column label="仓库" width="150">
              <template #default="{ row }">
                {{ row.repo?.name }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="明细数量" width="100" align="center">
              <template #default="{ row }">
                {{ row.details?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  text
                  @click="handleViewTask(row)"
                >
                  {{ row.status === "IN_PROGRESS" ? "继续盘点" : "查看详情" }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-4 flex justify-end">
            <el-pagination
              v-model:current-page="taskPagination.currentPage"
              v-model:page-size="taskPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="taskPagination.total"
              @size-change="loadTaskList"
              @current-change="loadTaskList"
            />
          </div>
        </el-card>
      </template>
    </template>

    <!-- 创建盘点任务弹窗 -->
    <el-dialog
      v-model="showCreateTaskDialog"
      title="创建盘点任务"
      width="500px"
    >
      <el-form :model="newTaskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="newTaskForm.name" placeholder="留空则自动生成" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="newTaskForm.remark"
            type="textarea"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateTask">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
