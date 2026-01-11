<script setup lang="ts">
import { onMounted, ref } from "vue";
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
  type Repo
} from "@/api/company/repo";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "warehouseManagement"
});
const dataList = ref<Repo[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  name: undefined,
  desc: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getRepoListInfo = async () => {
  loading.value = true;
  const { data, code, msg } = await getRepoListApi(
    pagination.value.currentPage,
    {
      name: form.value.name,
      desc: form.value.desc
    }
  );
  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else {
    message(msg, { type: "error" });
  }
  loading.value = false;
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getRepoListInfo();
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getRepoListInfo();
}

async function handleDelete(row: Repo) {
  await deleteRepoApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}

async function handleToggleStatus(row: Repo) {
  const { code, msg } = await toggleRepoApi(row.uid);
  if (code === 200) {
    message("状态已更新", { type: "success" });
    getRepoListInfo();
  } else {
    message(msg, { type: "error" });
  }
}

onMounted(async () => {
  await getRepoListInfo();
});
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
      <PureTableBar :title="$route.meta.title" @refresh="getRepoListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增', undefined, onSearch)"
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
                @click="openDialog('修改', row, onSearch)"
              >
                修改
              </el-button>

              <DeleteButton
                :show-icon="false"
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
