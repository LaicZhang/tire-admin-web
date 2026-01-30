<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import {
  getEmployeeListApi,
  deleteEmployeeApi,
  layoffEmployeeApi,
  reinstateEmployeeApi,
  suspendEmployeeApi,
  unsuspendEmployeeApi,
  restoreEmployeeApi,
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
  scope: "nonDeleted" as "active" | "nonDeleted" | "deleted" | "all",
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
      scope: form.value.scope,
      name: form.value.name || undefined,
      status: form.value.status ?? undefined,
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

async function handleLayoff(row: Employee) {
  try {
    await layoffEmployeeApi(row.uid);
    message(`已将${row.name}标记为离职`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "员工离职操作失败");
  }
}

async function handleReinstate(row: Employee) {
  try {
    await reinstateEmployeeApi(row.uid);
    message(`已将${row.name}复职`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "员工复职操作失败");
  }
}

async function handleSuspend(row: Employee) {
  try {
    await suspendEmployeeApi(row.uid);
    message(`已停用${row.name}`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "停用员工失败");
  }
}

async function handleUnsuspend(row: Employee) {
  try {
    await unsuspendEmployeeApi(row.uid);
    message(`已启用${row.name}`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "启用员工失败");
  }
}

async function handleRestore(row: Employee) {
  try {
    await restoreEmployeeApi(row.uid);
    message(`已恢复${row.name}`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "恢复员工失败");
  }
}

const getSysDict = async () => {
  const dict = (await localForage().getItem(SYS.dict)) as Record<
    string,
    unknown
  >;
  employeeStatus.value = dict.employeeStatus;
};

const employeeStatus = ref<
  Array<{ id: number; key: string | number; cn: string }>
>([]);

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
      <el-form-item label="范围：" prop="scope">
        <el-select
          v-model="form.scope"
          placeholder="请选择范围"
          class="w-[180px]!"
        >
          <el-option label="在职(未离职/未删除)" value="active" />
          <el-option label="含离职(未删除)" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>

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
                  row.layoffAt
                    ? "离职"
                    : employeeStatus.find(
                        item => Number(item.key) === Number(row.status)
                      )?.cn || "-"
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
                v-if="!row.deleteAt"
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>

              <el-popconfirm
                v-if="!row.deleteAt && !row.layoffAt"
                :title="`是否确认将${row.name}标记为离职？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleLayoff(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="warning">
                    离职
                  </el-button>
                </template>
              </el-popconfirm>

              <el-popconfirm
                v-if="!row.deleteAt && row.layoffAt"
                :title="`是否确认将${row.name}复职？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleReinstate(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="primary">
                    复职
                  </el-button>
                </template>
              </el-popconfirm>

              <el-popconfirm
                v-if="
                  !row.deleteAt && !row.layoffAt && Number(row.status) !== 2
                "
                :title="`是否确认停用${row.name}？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleSuspend(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="warning">
                    停用
                  </el-button>
                </template>
              </el-popconfirm>

              <el-popconfirm
                v-if="
                  !row.deleteAt && !row.layoffAt && Number(row.status) === 2
                "
                :title="`是否确认启用${row.name}？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleUnsuspend(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="success">
                    启用
                  </el-button>
                </template>
              </el-popconfirm>

              <el-popconfirm
                v-if="row.deleteAt"
                :title="`是否确认恢复${row.name}？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleRestore(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="primary">
                    恢复
                  </el-button>
                </template>
              </el-popconfirm>

              <DeleteButton
                v-if="!row.deleteAt"
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
