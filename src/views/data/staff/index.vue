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
import StatusTag from "@/components/StatusTag/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import StaffForm from "./form.vue";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import type { FormItemProps } from "./types";
import {
  getEmployeeListApi,
  addEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
  getEmployeeApi
} from "@/api/company/employee";

defineOptions({
  name: "DataStaff"
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
  keyword: ""
});

const staffStatusMap = {
  1: { label: "在职", type: "success" },
  0: { label: "离职", type: "danger" }
} as const;

const formColumns: PlusColumn[] = [
  {
    label: "职员姓名",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "关键字",
    prop: "keyword",
    valueType: "copy"
  }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const { code, data } = await getEmployeeListApi(
      pagination.value.currentPage,
      {
        name: state.value.name || undefined,
        keyword: state.value.keyword || undefined
      }
    );
    if (code === 200) {
      dataList.value = data.list.map((item: unknown) => ({
        ...item,
        phone: item.user?.phone || ""
      })) as FormItemProps[];
      pagination.value.total = data.count;
    }
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  state.value = { name: "", keyword: "" };
  handleSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  handleSearch();
};

const getDetails = async (row: { uid: string }) => {
  loading.value = true;
  try {
    const { data, code } = await getEmployeeApi(row.uid);
    if (code !== 200) return;
    const staff = data as FormItemProps;
    addDialog({
      title: "职员详情",
      props: {
        formInline: { ...staff, phone: (data as unknown).user?.phone || "" },
        disabled: true
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: ({ options }) =>
        h(StaffForm, {
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
    title: `${title}职员`,
    props: {
      formInline: {
        uid: row?.uid,
        code: row?.code ?? "",
        name: row?.name ?? "",
        nickname: row?.nickname ?? "",
        department: row?.department ?? "",
        position: row?.position ?? "",
        phone: row?.phone ?? "",
        email: row?.email ?? "",
        status: row?.status ?? 1,
        desc: row?.desc ?? ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(StaffForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props!.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          if (title === "新增") {
            // 构造符合API要求的数据结构
            const createData = {
              user: {
                username: curData.name,
                phone: curData.phone,
                email: curData.email
              },
              connectEmployeeDto: {
                jobs: [],
                companyId: ""
              },
              name: {
                name: curData.name,
                nickname: curData.nickname,
                desc: curData.desc,
                status: curData.status
              }
            };
            addEmployeeApi(createData).then(() => {
              message("操作成功", { type: "success" });
              done();
              handleSearch();
            });
          } else {
            const updateData = {
              name: {
                name: curData.name,
                nickname: curData.nickname,
                desc: curData.desc,
                status: curData.status
              },
              user: {
                phone: curData.phone,
                email: curData.email
              }
            };
            updateEmployeeApi(row?.uid ?? "", updateData).then(() => {
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
      `确定要删除职员 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    await deleteEmployeeApi(row.uid);
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
            新增职员
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
            <template #phone="{ row }">
              {{ row.user?.phone || row.phone || "-" }}
            </template>
            <template #status="{ row }">
              <StatusTag
                :status="row.status"
                :status-map="staffStatusMap"
                size="default"
              />
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
