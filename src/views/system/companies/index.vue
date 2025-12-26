<script setup lang="ts">
import { ref, onMounted, reactive, h } from "vue";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import { useColumns } from "./columns";
import { FormItemProps } from "./utils/types";
import CompanyForm from "./form.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils";
import {
  getCompanyListApi,
  addCompanyApi,
  updateCompanyApi,
  deleteCompanyApi
} from "@/api/company";

// Icons
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "CompanyManagement"
});

const searchFormRef = ref();
const formRef = ref();
const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange
} = useColumns();

const form = reactive({
  name: ""
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getCompanyListApi(pagination.currentPage, {
      ...form,
      pageSize: pagination.pageSize
    });
    dataList.value = data.list;
    pagination.total = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}公司`,
    props: {
      formInline: {
        id: row?.id,
        name: row?.name ?? "",
        contact: row?.contact ?? "",
        phone: row?.phone ?? "",
        address: row?.address ?? "",
        status: row?.status ?? 1
      }
    },
    width: "45%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(CompanyForm, {
        ref: formRef,
        formInline: options.props.formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const companyId = row?.id;
          if (title !== "新增" && companyId == null) {
            message("缺少公司ID", { type: "error" });
            return;
          }
          const promise =
            title === "新增"
              ? addCompanyApi(curData)
              : updateCompanyApi(companyId, curData);

          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            onSearch();
          });
        }
      });
    }
  });
};

const handleDelete = async (row: FormItemProps) => {
  if (row.id == null) return;
  await deleteCompanyApi(row.id);
  message("删除成功", { type: "success" });
  onSearch();
};

onMounted(() => {
  onSearch();
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
      <el-form-item label="公司名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入公司名称"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="公司管理" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增公司
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <el-popconfirm title="确认删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  :icon="useRenderIcon(Delete)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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
