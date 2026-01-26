<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { columns } from "./columns";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import CustomerForm from "./form.vue";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import type { FormItemProps } from "./types";
import { useCrud } from "@/composables";
import {
  getCustomerListApi,
  addCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
  getCustomerApi,
  type Customer
} from "@/api/business/customer";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "DataCustomer"
});

const formRef = ref();

const state = ref({
  name: "",
  keyword: ""
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  FormItemProps,
  CommonResult<PaginatedResponseDto<Customer>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getCustomerListApi(params.page, {
      name: state.value.name || undefined,
      keyword: state.value.keyword || undefined
    }),
  transform: (res: CommonResult<PaginatedResponseDto<Customer>>) => ({
    list: (res.data?.list ?? []) as FormItemProps[],
    total: res.data?.count ?? 0
  }),
  immediate: true
});

const formColumns: PlusColumn[] = [
  {
    label: "客户名称",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "关键字",
    prop: "keyword",
    valueType: "copy"
  }
];

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const handleReset = () => {
  state.value = { name: "", keyword: "" };
  handleSearch();
};

const getDetails = async (row: FormItemProps) => {
  if (!row.uid) return;
  const { data, code } = await getCustomerApi(row.uid);
  if (code !== 200) return;
  const customer = data as FormItemProps;
  addDialog({
    title: "客户详情",
    props: {
      formInline: { ...customer },
      disabled: true
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    hideFooter: true,
    contentRenderer: ({ options }) =>
      h(CustomerForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline,
        disabled: true
      })
  });
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}客户`,
    props: {
      formInline: {
        uid: row?.uid,
        code: row?.code ?? "",
        name: row?.name ?? "",
        contact: row?.contact ?? "",
        phone: row?.phone ?? "",
        address: row?.address ?? "",
        creditLimit: row?.creditLimit,
        levelId: row?.levelId,
        regionId: row?.regionId,
        desc: row?.desc ?? ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(CustomerForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props!.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const promise =
            title === "新增"
              ? addCustomerApi(curData)
              : updateCustomerApi(row?.uid ?? "", curData);
          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            handleSearch();
          });
        }
      });
    }
  });
};

const deleteOne = async (row: FormItemProps) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除客户 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    await deleteCustomerApi(row.uid!);
    message("删除成功", { type: "success" });
    handleSearch();
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};
</script>

<template>
  <div class="page-container">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="3"
      label-width="80"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar :title="$route.meta.title" @refresh="handleSearch">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增客户
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            border
            adaptive
            row-key="id"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="dataList"
            :columns="columns"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #level="{ row }">
              <el-tag v-if="row.level" type="info">{{ row.level.name }}</el-tag>
              <span v-else>-</span>
            </template>
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Eye)"
                @click.prevent="getDetails(row)"
              >
                查看
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click.prevent="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click.prevent="deleteOne(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

:deep(.el-card) {
  border: none;
  box-shadow: none;
}
</style>
