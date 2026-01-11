<script setup lang="ts">
import { ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import {
  getDepartmentListApi,
  deleteDepartmentApi,
  getDepartmentRolesApi,
  setDepartmentRolesApi,
  removeDepartmentRolesApi
} from "@/api";
import type { Department } from "@/api/company/department";
import { getRolesApi } from "@/api/system/role";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/hooks/useCrud";
import ReSearchForm from "@/components/ReSearchForm/index.vue";

defineOptions({
  name: "department"
});

const form = ref({
  name: undefined,
  desc: undefined
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud({
  api: async ({ page, pageSize, ...params }) => {
    const res = await getDepartmentListApi(page, { ...params, pageSize });
    if (res.code !== 200) throw new Error(res.msg);
    return res;
  },
  params: form,
  transform: ({ data }) => ({ list: data.list, total: data.count })
});

// 角色管理相关
const rolesDialogVisible = ref(false);
const rolesLoading = ref(false);
const currentDepartment = ref<{ uid: string; name: string } | null>(null);
const departmentRoles = ref<string[]>([]);
const allRoles = ref<{ uid: string; name: string }[]>([]);
const selectedRoles = ref<string[]>([]);

const onReset = () => {
  form.value = {
    name: undefined,
    desc: undefined
  };
  fetchData();
};

async function handleDelete(row: Department) {
  await deleteDepartmentApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

// 打开角色管理对话框
async function openRolesDialog(row: { uid: string; name: string }) {
  currentDepartment.value = row;
  rolesDialogVisible.value = true;
  rolesLoading.value = true;

  try {
    // 获取所有角色
    const rolesRes = await getRolesApi(1, { pageSize: 100 });
    if (rolesRes.code === 200) {
      allRoles.value = rolesRes.data?.list || [];
    }

    // 获取部门当前角色
    const deptRolesRes = await getDepartmentRolesApi(row.uid);
    if (deptRolesRes.code === 200) {
      departmentRoles.value = deptRolesRes.data || [];
      selectedRoles.value = [...departmentRoles.value];
    }
  } catch {
    message("获取角色信息失败", { type: "error" });
  } finally {
    rolesLoading.value = false;
  }
}

// 保存角色分配
async function saveRoles() {
  if (!currentDepartment.value) return;

  rolesLoading.value = true;
  try {
    // 计算需要添加和删除的角色
    const toAdd = selectedRoles.value.filter(
      (r: string) => !departmentRoles.value.includes(r)
    );
    const toRemove = departmentRoles.value.filter(
      (r: string) => !selectedRoles.value.includes(r)
    );

    // 添加新角色
    if (toAdd.length > 0) {
      await setDepartmentRolesApi(currentDepartment.value.uid, toAdd);
    }

    // 移除角色
    if (toRemove.length > 0) {
      await removeDepartmentRolesApi(currentDepartment.value.uid, toRemove);
    }

    message("角色分配保存成功", { type: "success" });
    rolesDialogVisible.value = false;
  } catch {
    message("保存失败", { type: "error" });
  } finally {
    rolesLoading.value = false;
  }
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      :form="form"
      :loading="loading"
      @search="fetchData"
      @reset="onReset"
    >
      <el-form-item label="名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入部门名称"
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
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增部门
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
            @page-size-change="onSizeChange"
            @page-current-change="onCurrentChange"
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
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="warning"
                @click="openRolesDialog(row)"
              >
                角色
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

    <!-- 角色管理对话框 -->
    <el-dialog
      v-model="rolesDialogVisible"
      :title="`管理部门角色 - ${currentDepartment?.name}`"
      width="500px"
    >
      <div v-loading="rolesLoading" class="min-h-[200px]">
        <el-checkbox-group v-model="selectedRoles">
          <el-checkbox
            v-for="role in allRoles"
            :key="role.uid"
            :value="role.uid"
            :label="role.name"
            class="mb-2 w-full"
          />
        </el-checkbox-group>
        <el-empty v-if="allRoles.length === 0" description="暂无可分配角色" />
      </div>
      <template #footer>
        <el-button @click="rolesDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="rolesLoading" @click="saveRoles">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
