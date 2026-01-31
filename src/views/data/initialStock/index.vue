<script setup lang="ts">
import { ref, h, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { InitialStock, InitialStockForm, InitialStockItem } from "./types";
import type { FormInstance } from "element-plus";
import {
  deleteInitialStockApi,
  getInitialStockListApi,
  upsertInitialStockApi
} from "@/api/data/initial-stock";
import { getRepoListApi, getRepoBatchApi, type Repo } from "@/api/company/repo";
import { getTireBatchApi, type Tire } from "@/api/business/tire";

defineOptions({
  name: "InitialStock"
});

const dataList = ref<InitialStock[]>([]);
const loading = ref(false);
const formRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<InitialStock[]>([]);
const form = ref({
  tireId: undefined,
  repoId: undefined,
  keyword: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName", width: 120 },
  { label: "期初数量", prop: "quantity", width: 100 },
  { label: "成本单价", prop: "costPrice", width: 100 },
  { label: "成本金额", prop: "costAmount", width: 120 },
  { label: "批次号", prop: "batchNo", width: 120 },
  { label: "备注", prop: "remark" },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];

// 仓库列表
const repoList = ref<Array<{ uid: string; name: string }>>([]);

const getList = async () => {
  loading.value = true;
  try {
    const [rawList, repoRes] = await Promise.all([
      getInitialStockListApi(),
      getRepoListApi(1).catch(() => null)
    ]);
    repoList.value =
      repoRes?.data?.list?.map(r => ({ uid: r.uid, name: r.name })) ?? [];

    const tireIds = Array.from(new Set(rawList.map(i => i.tireId)));
    const repoIds = Array.from(new Set(rawList.map(i => i.repoId)));

    // 批量获取 (2次请求代替 N*2 次)
    const [tiresRes, reposRes] = await Promise.all([
      getTireBatchApi(tireIds).catch(() => null),
      getRepoBatchApi(repoIds).catch(() => null)
    ]);

    const tireMap = new Map<string, Tire>();
    for (const t of tiresRes?.data ?? []) {
      tireMap.set(t.uid, t);
    }

    const repoMap = new Map<string, Repo>();
    for (const r of reposRes?.data ?? []) {
      repoMap.set(r.uid, r);
    }

    let rows: InitialStock[] = rawList.map((item, idx) => {
      const tire = tireMap.get(item.tireId);
      const repo = repoMap.get(item.repoId);
      const costPrice = item.costPrice ?? 0;
      const quantity = item.quantity ?? 0;
      return {
        id: idx + 1,
        uid: item.uid,
        tireId: item.tireId,
        tireName: tire?.name,
        tireCode: tire?.barcode ?? tire?.barCode ?? tire?.number,
        repoId: item.repoId,
        repoName: repo?.name,
        quantity,
        costPrice,
        costAmount: quantity * costPrice,
        batchNo: item.batchNo,
        remark: item.remark,
        createdAt: item.createdAt
      };
    });

    if (form.value.repoId)
      rows = rows.filter(r => r.repoId === form.value.repoId);
    const keyword = (form.value.keyword ?? "").trim();
    if (keyword) {
      rows = rows.filter(
        r =>
          (r.tireName ?? "").includes(keyword) ||
          (r.tireCode ?? "").includes(keyword)
      );
    }

    pagination.value.total = rows.length;
    const start =
      (pagination.value.currentPage - 1) * pagination.value.pageSize;
    dataList.value = rows.slice(start, start + pagination.value.pageSize);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  pagination.value.currentPage = 1;
  getList();
};

const resetForm = (formEl: InstanceType<typeof ReSearchForm> | null) => {
  formEl?.resetFields();
  onSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getList();
};

const handleSelectionChange = (rows: InitialStock[]) => {
  selectedRows.value = rows;
};

const dialogFormRef = ref<{
  getRef: () => FormInstance;
  getStockItems: () => Array<InitialStockItem & { _uid: string }>;
} | null>(null);

const openDialog = (title = "新增", row?: InitialStock) => {
  addDialog({
    title: `${title}期初库存`,
    props: {
      formInline: {
        id: row?.id,
        uid: row?.uid,
        tireId: row?.tireId ?? "",
        repoId: row?.repoId ?? "",
        quantity: row?.quantity ?? 0,
        costPrice: row?.costPrice ?? 0,
        batchNo: row?.batchNo ?? "",
        remark: row?.remark ?? ""
      },
      isEdit: title === "编辑"
    },
    width: "800px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: InitialStockForm })
          .formInline,
        isEdit: (options.props as { isEdit: boolean }).isEdit
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const stockItems = dialogFormRef.value?.getStockItems();
          // 验证库存明细
          const validItems = stockItems?.filter(
            item => item.repoId && item.quantity > 0
          );
          if (!validItems || validItems.length === 0) {
            message("请至少添加一个仓库的期初库存", { type: "warning" });
            return;
          }
          const cur = (options.props as { formInline: InitialStockForm })
            .formInline;
          const tasks = validItems.map((it, idx) =>
            upsertInitialStockApi({
              uid: idx === 0 ? cur.uid : undefined,
              tireId: cur.tireId,
              repoId: it.repoId,
              quantity: it.quantity,
              costPrice: it.costPrice,
              batchNo: it.batchNo,
              remark: cur.remark
            })
          );
          await Promise.all(tasks);
          message(`${title}成功`, { type: "success" });
          done();
          getList();
        }
      });
    }
  });
};

const handleDelete = async (row: InitialStock) => {
  await deleteInitialStockApi(row.uid);
  message(`删除${row.tireName}在${row.repoName}的期初库存成功`, {
    type: "success"
  });
  getList();
};

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    message("请选择要删除的数据", { type: "warning" });
    return;
  }
  Promise.all(selectedRows.value.map(r => deleteInitialStockApi(r.uid))).then(
    () => {
      message(`批量删除${selectedRows.value.length}条数据成功`, {
        type: "success"
      });
      getList();
    }
  );
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="formRef"
      class="m-1"
      :form="form"
      :loading="loading"
      :body-style="{ paddingBottom: '0', overflow: 'auto' }"
      @search="onSearch"
      @reset="resetForm(formRef)"
    >
      <el-form-item label="商品名称：" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入商品名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="仓库：" prop="repoId">
        <el-select
          v-model="form.repoId"
          placeholder="请选择仓库"
          clearable
          class="w-[180px]!"
        >
          <el-option
            v-for="item in repoList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="商品期初库存" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(Delete)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button :icon="useRenderIcon(ImportIcon)"> 导入 </el-button>
          <el-button :icon="useRenderIcon(ExportIcon)"> 导出 </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDialog('编辑', row)">
                编辑
              </el-button>
              <DeleteButton
                :show-icon="false"
                :title="`确认删除${row.tireName}在${row.repoName}的期初库存?`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
