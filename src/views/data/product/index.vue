<script setup lang="ts">
import { onMounted, ref, h } from "vue";
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
import ProductForm from "./form.vue";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import type { FormItemProps } from "./types";
import {
  getTireListApi,
  addTireApi,
  updateTireApi,
  deleteTireApi,
  getTireApi
} from "@/api/business/tire";

defineOptions({
  name: "DataProduct"
});

const loading = ref(false);
const dataList = ref<FormItemProps[]>([]);
const formRef = ref();
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const state = ref({
  name: "",
  group: ""
});

const formColumns: PlusColumn[] = [
  {
    label: "商品名称",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "分组",
    prop: "group",
    valueType: "copy"
  }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const { code, data } = await getTireListApi(pagination.value.currentPage, {
      keyword: state.value.name,
      group: state.value.group
    });
    if (code === 200) {
      dataList.value = data.list as FormItemProps[];
      pagination.value.total = data.count;
    }
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  state.value = { name: "", group: "" };
  handleSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  handleSearch();
};

const getDetails = async (row: { uid: string }) => {
  loading.value = true;
  try {
    const { data, code } = await getTireApi(row.uid);
    if (code !== 200) return;
    const product = data as FormItemProps;
    addDialog({
      title: "商品详情",
      props: {
        formInline: { ...product },
        disabled: true
      },
      width: "50%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: ({ options }) =>
        h(ProductForm, {
          ref: formRef,
          formInline: (options.props as { formInline: FormItemProps })
            .formInline,
          disabled: true
        })
    });
  } finally {
    loading.value = false;
  }
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}商品`,
    props: {
      formInline: {
        uid: row?.uid,
        name: row?.name ?? "",
        group: row?.group ?? "默认",
        brand: row?.brand ?? "",
        pattern: row?.pattern ?? "",
        format: row?.format ?? "",
        unit: row?.unit ?? "个",
        purchasePrice: row?.purchasePrice,
        salePrice: row?.salePrice,
        minStock: row?.minStock,
        maxStock: row?.maxStock,
        enableSerialNumber: row?.enableSerialNumber ?? false,
        enableBatch: row?.enableBatch ?? false,
        desc: row?.desc ?? ""
      }
    },
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(ProductForm, {
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
              ? addTireApi(curData)
              : updateTireApi(row?.uid ?? "", curData);
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

const deleteOne = async (row: { uid: string; name: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    await deleteTireApi(row.uid);
    message("删除成功", { type: "success" });
    handleSearch();
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

onMounted(() => {
  handleSearch();
});
</script>

<template>
  <div class="main">
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
            新增商品
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
            @page-current-change="handleCurrentChange"
          >
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
.main {
  margin: 20px;
}

:deep(.el-card) {
  border: none;
  box-shadow: none;
}
</style>
