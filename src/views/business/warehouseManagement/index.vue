<script setup lang="ts">
import { ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import {
  getRepoListApi,
  deleteRepoApi,
  toggleRepoApi,
  type Repo,
  type RepoQueryDto
} from "@/api/company/repo";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "warehouseManagement"
});

type RepoListParams = RepoQueryDto & { page?: number; pageSize?: number };

const formRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref<RepoListParams>({
  name: undefined,
  desc: undefined
});

const { loading, dataList, pagination, fetchData, handleDelete } = useCrud<
  Repo,
  CommonResult<PaginatedResponseDto<Repo>>,
  RepoListParams
>({
  api: async ({ page = 1, pageSize = 10, ...rest }) => {
    return await getRepoListApi(page, { ...rest, pageSize });
  },
  deleteApi: id => deleteRepoApi(String(id)),
  params: form,
  transform: res => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? 0
  })
});

const onSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const resetForm = (formEl: InstanceType<typeof ReSearchForm> | null) => {
  formEl?.resetFields();
  onSearch();
};

// Wrapper for delete to show message
async function onDelete(row: Repo) {
  try {
    await handleDelete(row.uid);
    message(`您删除了${row.name}这条数据`, { type: "success" });
  } catch (e) {
    // Error handled by useCrud or here
  }
}

async function handleToggleStatus(row: Repo) {
  const { code, msg } = await toggleRepoApi(row.uid);
  if (code === 200) {
    message("状态已更新", { type: "success" });
    fetchData();
  } else {
    message(msg, { type: "error" });
  }
}

function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  fetchData();
}
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
      <el-form-item label="仓库名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入仓库名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="备注：" prop="desc">
        <el-input
          v-model="form.desc"
          placeholder="请输入备注"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增', undefined, fetchData)"
          >
            新增仓库
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleToggleStatus(row)"
              >
                {{ row.status ? "停用" : "启用" }}
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row, fetchData)"
              >
                修改
              </el-button>

              <DeleteButton
                :show-icon="false"
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="onDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
