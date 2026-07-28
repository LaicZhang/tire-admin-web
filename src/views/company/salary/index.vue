<script setup lang="ts">
import { ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import Check from "~icons/ep/check";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { openDialog, confirmRow } from "./table";
import {
  getSalaryListApi,
  deleteSalaryApi,
  type Salary
} from "@/api/company/salary";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "Salary"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  employeeId: undefined as string | undefined,
  date: undefined as number | undefined
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Salary,
  CommonResult<PaginatedResponseDto<Salary>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getSalaryListApi(params.page, {
      employeeId: form.value.employeeId || undefined,
      date: form.value.date || undefined
    }),
  transform: (res: CommonResult<PaginatedResponseDto<Salary>>) => ({
    list: res.data?.list ?? [],
    total: res.data?.total ?? res.data?.count ?? 0
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

async function handleDelete(row: Salary) {
  await deleteSalaryApi(row.uid);
  message(`您删除了员工 ${row.employeeId} 的月度工资`, { type: "success" });
  fetchData();
}

async function handleConfirm(row: Salary) {
  await confirmRow(row.uid, fetchData);
}
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
      <el-form-item label="员工ID：" prop="employeeId">
        <el-input
          v-model="form.employeeId"
          placeholder="员工 uid"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="月份：" prop="date">
        <el-input
          v-model.number="form.date"
          placeholder="YYYYMM"
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
            @click="openDialog('新增', undefined, fetchData)"
          >
            新增月度工资
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
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row, fetchData)"
              >
                查看
              </el-button>
              <el-button
                v-if="!row.confirmedAt"
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row, fetchData)"
              >
                修改
              </el-button>
              <el-button
                v-if="!row.confirmedAt"
                class="reset-margin"
                link
                type="success"
                :icon="useRenderIcon(Check)"
                @click="handleConfirm(row)"
              >
                确认
              </el-button>
              <DeleteButton
                v-if="!row.confirmedAt"
                :title="`是否确认删除员工 ${row.employeeId} 的月度工资`"
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
