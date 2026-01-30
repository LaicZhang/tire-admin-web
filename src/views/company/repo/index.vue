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
  restoreRepoApi,
  startRepoApi,
  stopRepoApi,
  setDefaultRepoApi,
  type Repo
} from "@/api/company/repo";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "repo"
});

const formRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  name: undefined,
  desc: undefined,
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all"
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Repo,
  CommonResult<PaginatedResponseDto<Repo>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getRepoListApi(params.page, {
      name: form.value.name || undefined,
      desc: form.value.desc || undefined,
      scope: form.value.scope
    }),
  transform: (res: CommonResult<PaginatedResponseDto<Repo>>) => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? 0
  }),
  immediate: true
});

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = () => {
  formRef.value?.resetFields();
  handleSearch();
};

async function handleDelete(row: Repo) {
  await deleteRepoApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

async function handleRestore(row: Repo) {
  await restoreRepoApi(row.uid);
  message(`已恢复仓库「${row.name}」`, { type: "success" });
  fetchData();
}

async function handleToggleRepo(row: Repo) {
  if (row.status === true) {
    await stopRepoApi(row.uid);
    message(`已停用仓库「${row.name}」`, { type: "success" });
  } else {
    await startRepoApi(row.uid);
    message(`已启用仓库「${row.name}」`, { type: "success" });
  }
  fetchData();
}

async function handleSetDefault(row: Repo) {
  await setDefaultRepoApi(row.uid);
  message(`已将「${row.name}」设为默认仓库`, { type: "success" });
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
      @search="handleSearch"
      @reset="resetForm"
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
      <el-form-item label="范围：" prop="scope">
        <el-select v-model="form.scope" class="w-[180px]!" clearable>
          <el-option label="未删除" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增仓库
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                v-if="!row.deleteAt"
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row)"
              >
                查看
              </el-button>
              <el-button
                v-if="!row.deleteAt"
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>

              <el-popconfirm
                v-if="!row.deleteAt"
                :title="`是否确认${row.status === true ? '停用' : '启用'}${row.name}`"
                @confirm="handleToggleRepo(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="primary">
                    {{ row.status === true ? "停用" : "启用" }}
                  </el-button>
                </template>
              </el-popconfirm>

              <el-popconfirm
                v-if="!row.deleteAt && !row.isPrimary"
                :title="`是否将${row.name}设为默认仓库`"
                @confirm="handleSetDefault(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="success">
                    设为默认
                  </el-button>
                </template>
              </el-popconfirm>
              <el-tag
                v-else-if="!row.deleteAt && row.isPrimary"
                type="success"
                size="small"
                class="ml-2"
              >
                默认
              </el-tag>

              <DeleteButton
                v-if="!row.deleteAt"
                :title="`是否确认删除${row.name}这条数据`"
                :show-icon="false"
                @confirm="handleDelete(row)"
              />
              <el-button
                v-else
                class="reset-margin"
                link
                type="primary"
                @click="handleRestore(row)"
              >
                恢复
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
