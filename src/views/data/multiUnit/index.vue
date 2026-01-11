<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { MultiUnitItem, UnitOption } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getMultiUnitListApi,
  createMultiUnitApi,
  updateMultiUnitApi,
  deleteMultiUnitApi,
  getAllSingleUnitsApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";

defineOptions({
  name: "MultiUnitManagement"
});

const dataList = ref<MultiUnitItem[]>([]);
const unitOptions = ref<UnitOption[]>([]);
const loading = ref(false);
const searchFormRef = ref();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  name: ""
});

const columns: TableColumnList = [
  {
    label: "单位组名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "基本单位",
    prop: "baseUnitName",
    minWidth: 100
  },
  {
    label: "换算关系",
    prop: "conversions",
    minWidth: 250,
    cellRenderer: ({ row }) => {
      if (!row.conversions?.length) return h("span", "-");
      const texts = row.conversions.map(
        (c: { unitName: string; ratio: number }) =>
          `1${c.unitName}=${c.ratio}${row.baseUnitName}`
      );
      return h("span", texts.join("; "));
    }
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];

const loadUnitOptions = async () => {
  try {
    const { data, code } = await getAllSingleUnitsApi();
    if (code === 200) {
      unitOptions.value = data || [];
    }
  } catch (e) {
    console.error(e);
  }
};

const getData = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getMultiUnitListApi(
      pagination.currentPage,
      { ...form }
    );
    if (code === 200) {
      dataList.value = data.list || [];
      pagination.total = data.count || data.total || 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.currentPage = 1;
  getData();
};

const handleDelete = async (row: MultiUnitItem) => {
  try {
    const { code, msg } = await deleteMultiUnitApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      getData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "删除失败", { type: "error" });
  }
};

function openDialog(title = "新增", row?: MultiUnitItem) {
  addDialog({
    title: `${title}多计量单位`,
    props: {
      formInline: {
        name: row?.name ?? "",
        baseUnitUid: row?.baseUnitUid ?? "",
        conversions:
          row?.conversions?.map(c => ({
            unitUid: c.unitUid,
            ratio: c.ratio
          })) ?? [],
        sort: row?.sort ?? 0,
        remark: row?.remark ?? ""
      },
      unitOptions: unitOptions.value,
      isEdit: title === "修改"
    },
    width: "600px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(Form, { ref: "formRef" }),
    beforeSure: async (done, { options }) => {
      const formRef = (options as unknown).contentRef?.getRef?.();
      if (!formRef) return;
      await formRef.validate(async (valid: boolean) => {
        if (!valid) return;
        const formData = (options.props as unknown).formInline;
        try {
          const promise =
            title === "新增"
              ? createMultiUnitApi({
                  name: formData.name,
                  baseUnitUid: formData.baseUnitUid,
                  conversions: formData.conversions.filter(
                    (c: { unitUid: string }) => c.unitUid
                  ),
                  sort: formData.sort,
                  remark: formData.remark
                })
              : updateMultiUnitApi(row!.uid, {
                  name: formData.name,
                  baseUnitUid: formData.baseUnitUid,
                  conversions: formData.conversions.filter(
                    (c: { unitUid: string }) => c.unitUid
                  ),
                  sort: formData.sort,
                  remark: formData.remark
                });
          const { code, msg } = await promise;
          if (code === 200) {
            message("操作成功", { type: "success" });
            done();
            getData();
          } else {
            message(msg || "操作失败", { type: "error" });
          }
        } catch (e: unknown) {
          const err = e as Error;
          message(err.message || "操作失败", { type: "error" });
        }
      });
    }
  });
}

onMounted(async () => {
  await loadUnitOptions();
  getData();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="单位组名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入单位组名称"
          clearable
          class="w-[200px]!"
          @keyup.enter="getData"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="getData"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="多计量单位" @refresh="getData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          row-key="uid"
          :loading="loading"
          :size="size"
          :columns="dynamicColumns"
          :data="dataList"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="getData"
          @page-current-change="getData"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <DeleteButton :show-icon="false" @confirm="handleDelete(row)" />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
