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
  getEmployeeListApi,
  deleteEmployeeApi,
  type Employee
} from "@/api/company/employee";
import { localForage, message, SYS, handleApiError } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "Employee"
});

const formRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  name: undefined,
  nickname: undefined,
  status: undefined,
  desc: undefined,
  phone: undefined,
  email: undefined
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Employee,
  CommonResult<PaginatedResponseDto<Employee>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getEmployeeListApi(params.page, {
      name: form.value.name || undefined,
      status: form.value.status || undefined,
      desc: form.value.desc || undefined
    }),
  transform: (res: CommonResult<PaginatedResponseDto<Employee>>) => ({
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
  formRef.value?.resetFields();
  handleSearch();
};

async function handleDelete(row: Employee) {
  try {
    await deleteEmployeeApi(row.uid);
    message(`您删除了${row.name}这条数据`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "删除员工失败");
  }
}

const getSysDict = async () => {
  const dict = (await localForage().getItem(SYS.dict)) as Record<
    string,
    unknown
  >;
  employeeStatus.value = dict.employeeStatus;
};

const employeeStatus = ref<Array<{ id: number; key: string; cn: string }>>([]);

onMounted(async () => {
  await getSysDict();
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
      @search="handleSearch"
      @reset="resetForm"
    >
      <el-form-item label="名字：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入员工名字"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请输入员工状态"
          clearable
          class="w-[180px]!"
        >
          <el-option
            v-for="item in employeeStatus"
            :key="item.id"
            :value="item.key"
            :label="item.cn"
          />
        </el-select>
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
            @page-current-change="onCurrentChange"
          >
            <template #employeeStatus="{ row }">
              <div>
                {{
                  employeeStatus.find(item => item.key === row.status)?.cn ||
                  "-"
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
                @click="openDialog('修改', row)"
              >
                修改
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
