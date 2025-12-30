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
import AccountForm from "./form.vue";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import type { FormItemProps } from "./types";
import {
  getPaymentListApi,
  createPaymentApi,
  updatePaymentApi,
  deletePaymentApi,
  getPaymentApi
} from "@/api/payment";

defineOptions({
  name: "DataAccount"
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
  name: ""
});

const formColumns: PlusColumn[] = [
  {
    label: "账户名称",
    prop: "name",
    valueType: "copy"
  }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const { code, data } = await getPaymentListApi();
    if (code === 200) {
      let list = (data as FormItemProps[]) || [];
      // 过滤搜索
      if (state.value.name) {
        list = list.filter((item: FormItemProps) =>
          item.name?.toLowerCase().includes(state.value.name.toLowerCase())
        );
      }
      dataList.value = list;
      pagination.value.total = list.length;
    }
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  state.value = { name: "" };
  handleSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  handleSearch();
};

const getDetails = async (row: { uid: string }) => {
  loading.value = true;
  try {
    const { data, code } = await getPaymentApi(row.uid);
    if (code !== 200) return;
    const account = data as FormItemProps;
    addDialog({
      title: "账户详情",
      props: {
        formInline: { ...account },
        disabled: true
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: ({ options }) =>
        h(AccountForm, {
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
    title: `${title}账户`,
    props: {
      formInline: {
        uid: row?.uid,
        name: row?.name ?? "",
        accountType: row?.accountType ?? "bank",
        bankName: row?.bankName ?? "",
        bankAccount: row?.bankAccount ?? "",
        initialBalance: row?.initialBalance ?? 0,
        desc: row?.desc ?? "",
        companyUid: row?.companyUid ?? ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(AccountForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props!.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          if (title === "新增") {
            const createData = {
              companyUid: curData.companyUid || "",
              name: curData.name,
              accountType: curData.accountType,
              bankName: curData.bankName,
              bankAccount: curData.bankAccount,
              initialBalance: curData.initialBalance
            };
            createPaymentApi(createData).then(() => {
              message("操作成功", { type: "success" });
              done();
              handleSearch();
            });
          } else {
            const updateData = {
              type: "top-up" as const,
              payment: {
                name: curData.name,
                bankName: curData.bankName,
                bankAccount: curData.bankAccount,
                accountType: curData.accountType
              }
            };
            updatePaymentApi(row?.uid ?? "", updateData).then(() => {
              message("操作成功", { type: "success" });
              done();
              handleSearch();
            });
          }
        }
      });
    }
  });
};

const deleteOne = async (row: { uid: string; name: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    await deletePaymentApi(row.uid);
    message("删除成功", { type: "success" });
    handleSearch();
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

const formatBalance = (balance: number | string) => {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  return num.toFixed(2);
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
            新增账户
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            border
            adaptive
            row-key="uid"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="dataList"
            :columns="columns"
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #balance="{ row }">
              <span class="font-bold text-primary">
                {{ formatBalance(row.balance || 0) }}
              </span>
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
.main {
  margin: 20px;
}

:deep(.el-card) {
  border: none;
  box-shadow: none;
}
</style>
