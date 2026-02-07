<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import { getTireNumberListApi, deleteTireNumberApi } from "@/api";
import type { TireNumberRow } from "@/api/business/tire-number";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "tireNumber"
});
const dataList = ref<TireNumberRow[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  number: "",
  desc: undefined
});
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});
const getTireNumberListInfo = async () => {
  const { data, code, msg } = await getTireNumberListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list || [];
  else message(msg, { type: "error" });
  pagination.value.total = data.count ?? data.total ?? 0;
};
const onSearch = async () => {
  loading.value = true;
  let res: Awaited<ReturnType<typeof getTireNumberListApi>>;
  if (form.value.number === "" && form.value.desc === undefined)
    res = await getTireNumberListApi(1);
  else {
    res = await getTireNumberListApi(pagination.value.currentPage, {
      number: form.value.number,
      desc: form.value.desc
    });
  }
  const { code, data, msg } = res;

  dataList.value = data.list || [];
  pagination.value.total = data.count ?? data.total ?? 0;
  loading.value = false;
};

const openImportDialog = () => {
  message("暂未开放", { type: "warning" });
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  const { data, code, msg } = await getTireNumberListApi(
    pagination.value.currentPage,
    {
      number: form.value.number,
      desc: form.value.desc
    }
  );
  if (code === 200) dataList.value = data.list || [];
  else message(msg, { type: "error" });
  pagination.value.total = data.count ?? data.total ?? 0;
  loading.value = false;
}

async function handleDelete(row: {
  uid: string;
  number?: string;
  name?: string;
}) {
  await deleteTireNumberApi(row.uid);
  message(`您删除了${row.number ?? row.name ?? ""}这条数据`, {
    type: "success"
  });
  onSearch();
}

onMounted(() => {
  onSearch();
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
      <el-form-item label="胎号：" prop="number">
        <el-input
          v-model="form.number"
          placeholder="请输入胎号"
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
      <PureTableBar :title="$route.meta.title" @refresh="getTireNumberListInfo">
        <template #buttons>
          <el-button type="primary" @click="openImportDialog">
            批量导入
          </el-button>

          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增胎号
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
            @page-current-change="handleCurrentChange"
          >
            <template #tireName="{ row }">
              <div>{{ row.tire.group }}-{{ row.tire.name }}</div>
            </template>
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
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>

              <DeleteButton
                :show-icon="false"
                :title="`是否确认删除${row.number}这条数据`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
