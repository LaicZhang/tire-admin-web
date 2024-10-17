<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getTireListApi, deleteTireApi, getDepartmentWithEmpApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "Tire"
});
const dataList = ref([]),
  loading = ref(false),
  formRef = ref(),
  form = ref({
    group: "",
    name: "",
    desc: ""
  }),
  pagination = ref({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

const getEmployeesWithTire = async () => {
  const { data, code } = await getDepartmentWithEmpApi();
  if (code === 200) {
    data.forEach(item => {
      localStorage.setItem(
        "department-with-employees:" + item.id,
        JSON.stringify(item)
      );
    });
  }
};
const getTireListInfo = async () => {
  const res = await getTireListApi(pagination.value.currentPage);
  if (res.code === 200) dataList.value = res.data.list;
  else message(res.message, { type: "error" });
  pagination.value.total = res.data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === "" && form.value.desc === "") await getTireListInfo();

  const { data } = await getTireListApi(pagination.value.currentPage, {
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
  await getTireListInfo();
}
async function handleDelete(row) {
  await deleteTireApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}

onMounted(async () => {
  await getEmployeesWithTire();
  await getTireListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-2">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
      >
        <el-form-item label="分组名称：" prop="group">
          <el-input
            v-model="form.group"
            placeholder="请输入分组名称"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
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

    <el-card class="m-2">
      <PureTableBar :title="$route.meta.title" @refresh="getTireListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增轮胎
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
                :icon="useRenderIcon(EditPen)"
              >
                修改
              </el-button>

              <!-- <el-popconfirm
                :title="`是否确认停用${row.name}`"
                @confirm="handleToggleTire(row)"
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
