<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { openDialog, openMenuDialog } from "./table";
import {
  getPositionListApi,
  deletePositionApi,
  type Position
} from "@/api/company/position";
import { ALL_LIST, localForage, message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "position"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  name: undefined,
  desc: undefined
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Position,
  CommonResult<PaginatedResponseDto<Position>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getPositionListApi(params.page, {
      name: form.value.name || undefined,
      desc: form.value.desc || undefined
    }),
  transform: (res: CommonResult<PaginatedResponseDto<Position>>) => ({
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
  searchFormRef.value?.resetFields();
  handleSearch();
};

async function handleDelete(row: Position) {
  await deletePositionApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

async function getAllPosition() {
  const { data, code, msg } = await getPositionListApi(0);
  if (code === 200) {
    await localForage().setItem(ALL_LIST.position, data);
  } else message(msg, { type: "error" });
}

onMounted(async () => {
  await getAllPosition();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="handleSearch"
      @reset="resetForm"
    >
      <el-form-item label="名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入职位名称"
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
            @click="openDialog()"
          >
            新增岗位
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
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row)"
              >
                查看
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openMenuDialog(row)"
              >
                菜单
              </el-button>
              <DeleteButton
                :title="`是否确认删除${row.name}这条数据`"
                :show-icon="false"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
