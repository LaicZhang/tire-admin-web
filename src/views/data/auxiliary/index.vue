<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { ref, reactive, h, watch } from "vue";
import type {
  AuxiliaryFormData,
  AuxiliaryItem,
  AuxiliaryType,
  TabConfig
} from "./types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getAuxiliaryListApi,
  createAuxiliaryApi,
  updateAuxiliaryApi,
  deleteAuxiliaryApi,
  batchDeleteAuxiliaryApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "AuxiliaryManagement"
});

const tabs: TabConfig[] = [
  { name: "income", label: "收入类别" },
  { name: "expense", label: "支出类别" },
  { name: "settlement", label: "结算方式" },
  { name: "customerLevel", label: "客户等级" },
  { name: "businessType", label: "业务类型" }
];

const activeTab = ref<AuxiliaryType>("income");
const searchFormRef = ref();
const selectedRows = ref<AuxiliaryItem[]>([]);
const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const form = reactive({
  name: "",
  code: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  AuxiliaryItem,
  CommonResult<PaginatedResponseDto<AuxiliaryItem>>,
  { page?: number; pageSize?: number }
>({
  api: ({ page = 1 }) =>
    getAuxiliaryListApi(page, activeTab.value, { ...form }),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: (res: CommonResult<PaginatedResponseDto<AuxiliaryItem>>) => {
    if (res.code !== 200) {
      message(res.msg, { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? res.data?.total ?? 0
    };
  },
  immediate: true
});

const getTabLabel = (type: AuxiliaryType): string => {
  const tab = tabs.find(t => t.name === type);
  return tab?.label || "";
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.value = { ...pagination.value, currentPage: 1 };
  getData();
};

const handleDelete = async (row: AuxiliaryItem) => {
  try {
    const { code, msg } = await deleteAuxiliaryApi(row.uid);
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

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    message("请选择要删除的数据", { type: "warning" });
    return;
  }
  try {
    const uids = selectedRows.value.map(row => row.uid);
    const { code, msg } = await batchDeleteAuxiliaryApi(uids);
    if (code === 200) {
      message("批量删除成功", { type: "success" });
      selectedRows.value = [];
      getData();
    } else {
      message(msg || "批量删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "批量删除失败", { type: "error" });
  }
};

const handleSelectionChange = (rows: AuxiliaryItem[]) => {
  selectedRows.value = rows;
};

function openDialog(title = "新增", row?: AuxiliaryItem) {
  addDialog({
    title: `${title}${getTabLabel(activeTab.value)}`,
    props: {
      formInline: {
        type: activeTab.value,
        code: row?.code ?? "",
        name: row?.name ?? "",
        sort: row?.sort ?? 0,
        remark: row?.remark ?? ""
      },
      isEdit: title === "修改"
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: AuxiliaryFormData })
          .formInline,
        isEdit: (options.props as { isEdit?: boolean }).isEdit
      }),
    beforeSure: async (done, { options }) => {
      const elForm = dialogFormRef.value?.getRef();
      if (!elForm) return;
      try {
        const valid = await elForm.validate();
        if (!valid) return;
        const formData = (options.props as { formInline: AuxiliaryFormData })
          .formInline;
        const promise =
          title === "新增"
            ? createAuxiliaryApi({
                type: activeTab.value,
                code: formData.code,
                name: formData.name,
                sort: formData.sort,
                remark: formData.remark
              })
            : row?.uid
              ? updateAuxiliaryApi(row.uid, {
                  name: formData.name,
                  sort: formData.sort,
                  remark: formData.remark
                })
              : null;
        if (!promise) {
          message("缺少数据ID，无法更新", { type: "error" });
          return;
        }
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
    }
  });
}

watch(activeTab, () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  form.name = "";
  form.code = "";
  getData();
});
</script>

<template>
  <div class="main">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
      />
    </el-tabs>

    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      class="mt-4"
      @search="getData"
      @reset="resetForm"
    >
      <el-form-item label="编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入编码"
          clearable
          class="w-[160px]"
          @keyup.enter="getData"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入名称"
          clearable
          class="w-[160px]"
          @keyup.enter="getData"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar :title="getTabLabel(activeTab)" @refresh="getData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增
        </el-button>
        <el-popconfirm
          title="确认批量删除选中数据?"
          @confirm="handleBatchDelete"
        >
          <template #reference>
            <el-button
              type="danger"
              :icon="useRenderIcon(Delete)"
              :disabled="!selectedRows.length"
            >
              批量删除
            </el-button>
          </template>
        </el-popconfirm>
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
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
          @selection-change="handleSelectionChange"
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
