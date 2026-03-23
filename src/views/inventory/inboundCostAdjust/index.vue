<script setup lang="ts">
import dayjs from "dayjs";
import { computed, reactive, ref } from "vue";
import { PAGE_SIZE_MEDIUM } from "@/utils/constants";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { handleApiError, message } from "@/utils";
import {
  getInboundCostAdjustListApi,
  saveInboundCostAdjustApi,
  type InboundCostAdjustItem,
  type InboundCostAdjustSourceType
} from "@/api/business/inboundCostAdjust";

defineOptions({
  name: "InventoryInboundCostAdjust"
});

type EditableDetail = InboundCostAdjustItem["details"][number] & {
  editableUnitPrice: number;
};

const loading = ref(false);
const saving = ref(false);
const dataList = ref<InboundCostAdjustItem[]>([]);
const selectedRow = ref<InboundCostAdjustItem | null>(null);
const editDetails = ref<EditableDetail[]>([]);
const dialogVisible = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const queryParams = reactive<{
  sourceType?: InboundCostAdjustSourceType;
  keyword?: string;
}>({
  sourceType: undefined,
  keyword: undefined
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_MEDIUM,
  currentPage: 1,
  background: true
});

const sourceTypeOptions = [
  { label: "组装单", value: "ASSEMBLY" },
  { label: "其他入库单", value: "OTHER_INBOUND" }
] as const;

const currentTotalCost = computed(() =>
  editDetails.value.reduce(
    (sum, detail) => sum + detail.count * detail.editableUnitPrice,
    0
  )
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getInboundCostAdjustListApi(
      pagination.value.currentPage,
      {
        ...queryParams,
        pageSize: pagination.value.pageSize
      }
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    }
  } catch (error) {
    handleApiError(error, "获取入库成本调整列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const handleReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.sourceType = undefined;
  queryParams.keyword = undefined;
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const openDetailDialog = (row: InboundCostAdjustItem) => {
  selectedRow.value = row;
  editDetails.value = row.details.map(detail => ({
    ...detail,
    editableUnitPrice: Number(detail.unitPrice || 0)
  }));
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!selectedRow.value) return;
  saving.value = true;
  try {
    await saveInboundCostAdjustApi(
      selectedRow.value.sourceType,
      selectedRow.value.uid,
      editDetails.value.map(detail => ({
        repoId: detail.repoId,
        tireId: detail.tireId,
        count: detail.count,
        unitPrice: detail.editableUnitPrice
      }))
    );
    message("保存成功", { type: "success" });
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    handleApiError(error, "保存入库成本调整失败");
  } finally {
    saving.value = false;
  }
};

void fetchData();
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="queryParams"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="来源类型" prop="sourceType">
        <el-select
          v-model="queryParams.sourceType"
          clearable
          placeholder="请选择来源"
          class="w-[150px]"
        >
          <el-option
            v-for="item in sourceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          clearable
          placeholder="单据编号/经办人"
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="入库成本调整" @refresh="fetchData">
        <el-table row-key="uid" border :data="dataList" :loading="loading">
          <el-table-column label="单据编号" prop="billNo" min-width="160" />
          <el-table-column
            label="来源类型"
            prop="sourceTypeLabel"
            width="120"
          />
          <el-table-column label="状态" prop="status" width="100">
            <template #default="{ row }">
              <el-tag type="success">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="明细数" width="90">
            <template #default="{ row }">
              {{ row.details.length }}
            </template>
          </el-table-column>
          <el-table-column label="当前总成本" min-width="120">
            <template #default="{ row }">
              {{ row.totalCost }}
            </template>
          </el-table-column>
          <el-table-column label="经办人" prop="operatorName" width="100" />
          <el-table-column label="创建时间" min-width="160">
            <template #default="{ row }">
              {{
                row.createdAt
                  ? dayjs(row.createdAt).format("YYYY-MM-DD HH:mm")
                  : "-"
              }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetailDialog(row)">
                查看明细
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.currentPage"
            @current-change="handleCurrentChange"
          />
        </div>
      </PureTableBar>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      width="900px"
      :title="
        selectedRow
          ? `${selectedRow.sourceTypeLabel} - ${selectedRow.billNo}`
          : '入库成本调整'
      "
    >
      <div class="mb-4 text-sm text-gray-500">
        当前合计成本：{{ currentTotalCost }}
      </div>
      <el-table :data="editDetails" border>
        <el-table-column label="仓库" prop="repoName" min-width="120" />
        <el-table-column label="商品" prop="tireName" min-width="160" />
        <el-table-column label="数量" prop="count" width="90" />
        <el-table-column label="当前单价" min-width="120">
          <template #default="{ row }">
            {{ row.unitPrice }}
          </template>
        </el-table-column>
        <el-table-column label="调整后单价" min-width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.editableUnitPrice"
              :min="0"
              :precision="0"
              controls-position="right"
            />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-sm {
  font-size: 12px;
}

.text-gray-500 {
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
