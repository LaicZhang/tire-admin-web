<script setup lang="ts">
import { ref } from "vue";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import EditPen from "~icons/ep/edit-pen";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  deleteStoreApi,
  getStoreListApi,
  restoreStoreApi,
  setDefaultStoreApi,
  startStoreApi,
  stopStoreApi,
  type Store,
  type StoreQueryDto
} from "@/api/company/store";
import { message } from "@/utils";
import { columns } from "./columns";
import { openDialog } from "./table";

defineOptions({
  name: "storeManagement"
});

type StoreListParams = StoreQueryDto & { page?: number; pageSize?: number };

const formRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref<StoreListParams>({
  name: undefined,
  desc: undefined
});

const { loading, dataList, pagination, fetchData, handleDelete } = useCrud<
  Store,
  CommonResult<PaginatedResponseDto<Store>>,
  StoreListParams
>({
  api: async ({ page = 1, pageSize = 10, ...rest }) => {
    return await getStoreListApi(page, { ...rest, pageSize });
  },
  deleteApi: id => deleteStoreApi(String(id)),
  params: form,
  transform: res => ({
    list: res.data?.list ?? [],
    total: res.data?.total ?? 0
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

async function onDelete(row: Store) {
  await handleDelete(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
}

async function handleToggleStatus(row: Store) {
  const response = row.status
    ? await stopStoreApi(row.uid)
    : await startStoreApi(row.uid);
  if (response.code === 200) {
    message("状态已更新", { type: "success" });
    fetchData();
  } else {
    message(response.msg, { type: "error" });
  }
}

async function handleRestore(row: Store) {
  await restoreStoreApi(row.uid);
  message(`已恢复门店「${row.name}」`, { type: "success" });
  fetchData();
}

async function handleSetDefault(row: Store) {
  await setDefaultStoreApi(row.uid);
  message(`已将「${row.name}」设为默认门店`, { type: "success" });
  fetchData();
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
      <el-form-item label="门店名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入门店名称"
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
            新增门店
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
              <el-button
                v-if="!row.isPrimary"
                class="reset-margin"
                link
                type="success"
                @click="handleSetDefault(row)"
              >
                设为默认
              </el-button>
              <el-tag v-else type="success" size="small">默认</el-tag>
              <el-button
                v-if="row.deleteAt"
                class="reset-margin"
                link
                type="warning"
                @click="handleRestore(row)"
              >
                恢复
              </el-button>
              <DeleteButton
                v-else
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
