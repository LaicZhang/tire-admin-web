<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { FormInstance } from "element-plus";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getTireNumberListApi, deleteTireNumberApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "tireNumber"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  number: "",
  desc: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});
const getTireNumberListInfo = async () => {
  const { data, code, msg } = await getTireNumberListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  let res;
  if (form.value.number === "" && form.value.desc === undefined)
    res = await getTireNumberListApi(1);
  else {
    res = await getTireNumberListApi(pagination.value.currentPage, {
      number: form.value.number,
      desc: form.value.desc
    });
  }
  const { code, data, msg } = res;

  dataList.value = data.list;
  pagination.value.total = data.count;
  loading.value = false;
};

const openImportDialog = () => {
  message("暂未开放", { type: "warning" });
};

const resetForm = (formEl: FormInstance | undefined) => {
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
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
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
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
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
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
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

              <el-popconfirm
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="danger">
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
