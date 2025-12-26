<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
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

defineOptions({
  name: "department"
});
const dataList = ref<Department[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  name: undefined,
  desc: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 角色管理相关
const rolesDialogVisible = ref(false);
const rolesLoading = ref(false);
const currentDepartment = ref<{ uid: string; name: string } | null>(null);
const departmentRoles = ref<string[]>([]);
const allRoles = ref<{ uid: string; name: string }[]>([]);
const selectedRoles = ref<string[]>([]);

const getDepartmentListInfo = async () => {
  const { data, code, msg } = await getDepartmentListApi(
    pagination.value.currentPage
  );
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};
const onSearch = async () => {
  loading.value = true;
  if (form.value.name === undefined && form.value.desc === undefined)
    await getDepartmentListInfo();

  const { data } = await getDepartmentListApi(pagination.value.currentPage, {
    ...form.value
  });

  dataList.value = data.list;
  pagination.value.total = data.count;
  loading.value = false;
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getDepartmentListInfo();
}

async function handleDelete(row: Department) {
  await deleteDepartmentApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
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
      r => !departmentRoles.value.includes(r)
    );
    const toRemove = departmentRoles.value.filter(
      r => !selectedRoles.value.includes(r)
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

onMounted(async () => {
  await getDepartmentListInfo();
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
      <PureTableBar :title="$route.meta.title" @refresh="getDepartmentListInfo">
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
