<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getTireListApi, deleteTireApi, getDepartmentWithEmpApi } from "@/api";
import { message, localForage, ALL_LIST } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { BaseImagePath } from "@/utils";

defineOptions({
  name: "Tire"
});
// const allTireList = ref([]);
const dataList = ref([]),
  loading = ref(false),
  formRef = ref(),
  form = ref({
    group: undefined,
    name: undefined,
    desc: undefined
  }),
  pagination = ref({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

const getEmployeesWithTire = async () => {
  const { data, code, msg } = await getDepartmentWithEmpApi();
  if (code === 200) {
    await localForage().setItem("dep-w-emp", data);
    data.forEach(item => {
      localForage().setItem("dep-w-emp:" + item.id, item);
    });
  } else message(msg, { type: "error" });
};
const getAllTires = async () => {
  const { data, code, msg } = await getTireListApi(0);
  const tasks = [];
  if (code === 200) {
    tasks.push(localForage().setItem(ALL_LIST.tire, data));
    data.forEach(element => {
      tasks.push(localForage().setItem("tire:" + element.name, element));
    });
  } else message(msg, { type: "error" });
  await Promise.all(tasks);
};
const getTireListInfo = async () => {
  const { data, code, msg } = await getTireListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (
    form.value.group === undefined &&
    form.value.desc === undefined &&
    form.value.name === undefined
  )
    await getTireListInfo();

  const { data } = await getTireListApi(pagination.value.currentPage, {
    ...form.value
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
  await onSearch();
}

onMounted(async () => {
  await getEmployeesWithTire();
  await getTireListInfo();
  await getAllTires();
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

    <el-card class="m-1">
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
            <template #covers="{ row }">
              <el-image
                v-for="item in row.covers"
                :key="item.id"
                :src="BaseImagePath + item.hash + '.' + item.ext"
                loading="lazy"
                hide-on-click-modal
                preview-teleported
                style="height: 30px"
                :preview-src-list="
                  row.covers.map(item => {
                    return BaseImagePath + item.hash + '.' + item.ext;
                  })
                "
              />
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
