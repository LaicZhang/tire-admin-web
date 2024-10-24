<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
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
  name: "",
  desc: ""
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});
const getReserveListInfo = async () => {
  const res = await getTireNumberListApi(pagination.value.currentPage);
  if (res.code === 200) dataList.value = res.data.list;
  else message(res.message, { type: "error" });
  pagination.value.total = res.data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === "" && form.value.desc === "")
    await getReserveListInfo();

  const { data } = await getTireNumberListApi(pagination.value.currentPage, {
    name: form.value.name,
    desc: form.value.desc
  });

  dataList.value = data.list;
  pagination.value.total = data.count;
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
  await getReserveListInfo();
}
async function handleDelete(row) {
  await deleteTireNumberApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}
// async function handleToggleReserve(row) {
//   await toggleReserveApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await getReserveListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
      >
        <el-form-item label="名称：" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入名称"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="备注：" prop="desc">
          <el-input
            v-model="form.desc"
            placeholder="请输入备注"
            clearable
            class="!w-[180px]"
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
      <PureTableBar :title="$route.meta.title" @refresh="getReserveListInfo">
        <template #buttons>
          <el-button type="primary" @click="openDialog()"> 胎号管理 </el-button>

          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增库存
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
              >
                修改
              </el-button>

              <!-- <el-popconfirm
                :title="`是否确认停用${row.name}`"
                @confirm="handleToggleReserve(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="primary">
                    {{ row.status === true ? "停用" : "启用" }}
                  </el-button>
                </template>
              </el-popconfirm> -->

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
