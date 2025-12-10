<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { openDialog } from "./table";

const handleOpenDialog = (title: string, row?: any) => {
  openDialog(title, row);
};
import {
  getFeedbackListApi,
  deleteFeedbackApi,
  addFeedbackApi,
  updateFeedbackApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "feedback"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  content: undefined,
  rating: undefined,
  status: undefined,
  type: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getFeedbackListInfo = async () => {
  loading.value = true;
  const { data, code, msg } = await getFeedbackListApi(
    pagination.value.currentPage
  );
  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else message(msg, { type: "error" });
  loading.value = false;
};

const onSearch = async () => {
  loading.value = true;
  const { data, code, msg } = await getFeedbackListApi(
    pagination.value.currentPage,
    {
      content: form.value.content,
      rating: form.value.rating,
      status: form.value.status,
      type: form.value.type
    }
  );

  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else message(msg, { type: "error" });
  loading.value = false;
};

const resetForm = formEl => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getFeedbackListInfo();
}

async function handleDelete(row) {
  await deleteFeedbackApi(row.uid);
  message(`您删除了反馈：${row.content?.substring(0, 20)}...`, {
    type: "success"
  });
  onSearch();
}

onMounted(async () => {
  await getFeedbackListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="内容：" prop="content">
          <el-input
            v-model="form.content"
            placeholder="请输入反馈内容"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
        <el-form-item label="评分：" prop="rating">
          <el-input-number
            v-model="form.rating"
            :min="1"
            :max="5"
            placeholder="请输入评分"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
        <el-form-item label="状态：" prop="status">
          <el-select
            v-model="form.status"
            placeholder="请选择状态"
            clearable
            class="w-[180px]!"
          >
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已处理" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型：" prop="type">
          <el-select
            v-model="form.type"
            placeholder="请选择类型"
            clearable
            class="w-[180px]!"
          >
            <el-option label="建议" :value="0" />
            <el-option label="问题" :value="1" />
            <el-option label="其他" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            :icon="useRenderIcon(Refresh)"
            type="primary"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="m-1">
      <PureTableBar title="反馈管理" :columns="columns" @refresh="onSearch">
        <template #buttons>
          <el-button
            :icon="useRenderIcon(AddFill)"
            type="primary"
            @click="() => openDialog('新增', null)"
          >
            新增反馈
          </el-button>
        </template>
        <template v-slot="{ size, checkList }">
          <pure-table
            :data="dataList"
            :columns="columns"
            :loading="loading"
            :size="size"
            :check-list="checkList"
            row-key="uid"
            align-whole="center"
            :pagination="pagination"
            :paginationSmall="size === 'small'"
            :header-cell-style="{
              background: 'var(--el-table-row-hover-bg-color)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleCurrentChange(1)"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                :icon="useRenderIcon(EditPen)"
                link
                type="primary"
                @click="() => openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                :icon="useRenderIcon(Delete)"
                link
                type="danger"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
