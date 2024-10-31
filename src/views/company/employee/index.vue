<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getEmployeeListApi, deleteEmployeeApi, getSysDictApi } from "@/api";
import { localForage, message, SYS } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "Employee"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  name: "",
  nickname: "",
  status: undefined,
  desc: undefined,
  phone: "",
  email: "",
  username: "",
  password: "",
  uid: "",
  id: 0,
  jobs: []
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});
const getEmployeeListInfo = async () => {
  const { data, code, msg } = await getEmployeeListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === undefined && form.value.desc === undefined)
    await getEmployeeListInfo();

  const { data } = await getEmployeeListApi(pagination.value.currentPage, {
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
  await getEmployeeListInfo();
}

async function handleDelete(row) {
  await deleteEmployeeApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  await onSearch();
}

const getSysDict = async () => {
  const { code, data, msg } = await getSysDictApi();
  if (code === 200) {
    const dict = Object.groupBy(data, ({ name }) => name);
    await localForage().setItem(SYS.dict, dict);
    employeeStatus.value = dict.employeeStatus;
  } else message(msg, { type: "error" });
};

const employeeStatus = ref([]);

onMounted(async () => {
  await getSysDict();
  await getEmployeeListInfo();
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
        <el-form-item label="名字：" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入员工名字"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="状态：" prop="status">
          <el-select
            v-model="form.status"
            placeholder="请输入员工状态"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="item in employeeStatus"
              :key="item.id"
              :value="item"
              :label="item.cn"
            />
          </el-select>
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
      <PureTableBar :title="$route.meta.title" @refresh="getEmployeeListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增员工
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
            <template #employeeStatus="{ row }">
              <div>
                {{
                  employeeStatus.find(item => {
                    if (item.key === row.status) return item.cn;
                  })["cn"]
                }}
              </div>
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
                  <el-button
                    class="reset-margin"
                    link
                    type="danger"
                    :icon="useRenderIcon(Delete)"
                  >
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
