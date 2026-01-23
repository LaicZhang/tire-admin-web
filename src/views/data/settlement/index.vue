<script setup lang="ts">
import { ref, reactive, onMounted, h, watch } from "vue";
import type { SettlementItem } from "./types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getSettlementListApi,
  createSettlementApi,
  updateSettlementApi,
  deleteSettlementApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import Form from "./form.vue";

defineOptions({
  name: "SettlementManagement"
});

const searchFormRef = ref();

const form = reactive({
  name: "",
  code: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  SettlementItem,
  { list: SettlementItem[]; total: number },
  typeof form
>({
  api: params => getSettlementListApi(pagination.value.currentPage, params),
  immediate: false,
  pagination: {
    pageSize: 10,
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  },
  params: form
});

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.value.currentPage = 1;
  fetchData();
};

const handleDelete = async (row: SettlementItem) => {
  try {
    const { code, msg } = await deleteSettlementApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "删除失败", { type: "error" });
  }
};

// 监听搜索表单变化，自动重新获取数据
watch(
  () => [form.name, form.code],
  () => {
    pagination.value.currentPage = 1;
    fetchData();
  },
  { deep: true }
);

function openDialog(title = "新增", row?: SettlementItem) {
  addDialog({
    title: `${title}结算方式`,
    props: {
      formInline: {
        code: row?.code ?? "",
        name: row?.name ?? "",
        isDefault: row?.isDefault ?? false,
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
              ? createSettlementApi({
                  code: formData.code,
                  name: formData.name,
                  isDefault: formData.isDefault,
                  sort: formData.sort,
                  remark: formData.remark
                })
              : updateSettlementApi(row!.uid, {
                  name: formData.name,
                  isDefault: formData.isDefault,
                  sort: formData.sort,
                  remark: formData.remark
                });
          const { code, msg } = await promise;
          if (code === 200) {
            message("操作成功", { type: "success" });
            done();
            fetchData();
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

// 初始加载数据
onMounted(() => {
  fetchData();
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
      <el-form-item label="编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入编码"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入名称"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="fetchData"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="结算方式" @refresh="fetchData">
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
          @page-size-change="onSizeChange(pagination.pageSize)"
          @page-current-change="onCurrentChange"
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
.page-container {
  @extend .page-container;
}

.search-form {
  @extend .search-form;
}
</style>
