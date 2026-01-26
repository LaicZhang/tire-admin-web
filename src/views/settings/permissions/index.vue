<script setup lang="tsx">
import { onMounted, ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import Setting from "~icons/ep/setting";
import { PureTableBar } from "@/components/RePureTableBar";
import { userColumns } from "./columns";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import UserForm from "./form.vue";
import type {
  PermissionUser,
  Role,
  PermissionModule,
  UserFormProps
} from "./types";
import {
  createRoleApi,
  deletePermissionUserApi,
  deleteRoleApi,
  getPermissionRolesApi,
  getPermissionUsersApi,
  savePermissionUserApi,
  saveRolePermissionsApi
} from "@/api/setting";

defineOptions({
  name: "Permissions"
});

const loading = ref(false);
const activeTab = ref("users");
const userList = ref<PermissionUser[]>([]);
const roleList = ref<Role[]>([]);
const formRef = ref();

const enableStatusMap = {
  1: { label: "启用", type: "success" },
  0: { label: "禁用", type: "danger" }
} as const;

// 权限模块数据
const permissionModules = ref<PermissionModule[]>([
  {
    id: "purchase",
    name: "采购管理",
    children: [
      { id: "purchase_order", name: "采购订单", code: "purchase:order" },
      { id: "purchase_in", name: "采购入库", code: "purchase:in" },
      { id: "purchase_return", name: "采购退货", code: "purchase:return" }
    ]
  },
  {
    id: "sales",
    name: "销售管理",
    children: [
      { id: "sales_order", name: "销售订单", code: "sales:order" },
      { id: "sales_out", name: "销售出库", code: "sales:out" },
      { id: "sales_return", name: "销售退货", code: "sales:return" }
    ]
  },
  {
    id: "inventory",
    name: "库存管理",
    children: [
      { id: "inventory_transfer", name: "调拨单", code: "inventory:transfer" },
      { id: "inventory_check", name: "盘点单", code: "inventory:check" },
      { id: "inventory_in", name: "其他入库", code: "inventory:in" },
      { id: "inventory_out", name: "其他出库", code: "inventory:out" }
    ]
  },
  {
    id: "finance",
    name: "资金管理",
    children: [
      { id: "finance_receive", name: "收款单", code: "finance:receive" },
      { id: "finance_pay", name: "付款单", code: "finance:pay" },
      { id: "finance_income", name: "其他收入", code: "finance:income" },
      { id: "finance_expense", name: "其他支出", code: "finance:expense" }
    ]
  }
]);

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "list" in payload) {
    const list = (payload as { list?: unknown }).list;
    return Array.isArray(list) ? (list as T[]) : [];
  }
  return [];
};

const loadData = async () => {
  loading.value = true;
  try {
    const [usersRes, rolesRes] = await Promise.all([
      getPermissionUsersApi(),
      getPermissionRolesApi()
    ]);

    if (usersRes.code === 200) {
      userList.value = toList<PermissionUser>(usersRes.data);
    } else {
      message(usersRes.msg || "加载用户失败", { type: "error" });
    }

    if (rolesRes.code === 200) {
      roleList.value = toList<Role>(rolesRes.data).map(r => ({
        ...r,
        permissions: Array.isArray(r.permissions) ? r.permissions : []
      }));
    } else {
      message(rolesRes.msg || "加载角色失败", { type: "error" });
    }
  } catch {
    message("加载数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const openUserDialog = (title = "新增", row?: PermissionUser) => {
  addDialog({
    title: `${title}用户`,
    props: {
      formInline: {
        uid: row?.uid,
        username: row?.username ?? "",
        phone: row?.phone ?? "",
        roleId: row?.roleId ?? "",
        warehouseIds: []
      }
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(UserForm, {
        ref: formRef,
        formInline: (options.props as UserFormProps).formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const curData = (options.props as UserFormProps).formInline;
          savePermissionUserApi(curData)
            .then(res => {
              if (res.code === 200) {
                message("操作成功", { type: "success" });
                done();
                loadData();
              } else {
                message(res.msg || "操作失败", { type: "error" });
              }
            })
            .catch(() => {
              message("操作失败", { type: "error" });
            });
        }
      });
    }
  });
};

const deleteUser = async (row: PermissionUser) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const res = await deletePermissionUserApi(row.uid);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

const openRolePermissionDialog = (role: Role) => {
  const checkedPermissions = ref<string[]>(
    Array.isArray(role.permissions) ? role.permissions : []
  );

  addDialog({
    title: `${role.name} - 权限设置`,
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () => (
      <div class="max-h-96 overflow-y-auto">
        {permissionModules.value.map(module => (
          <div key={module.id} class="mb-4">
            <div class="font-medium mb-2 text-gray-700">{module.name}</div>
            <el-checkbox-group v-model={checkedPermissions.value}>
              {module.children?.map(item => (
                <el-checkbox key={item.id} label={item.code}>
                  {item.name}
                </el-checkbox>
              ))}
            </el-checkbox-group>
          </div>
        ))}
      </div>
    ),
    beforeSure: done => {
      saveRolePermissionsApi(role.uid, checkedPermissions.value)
        .then(res => {
          if (res.code === 200) {
            role.permissions = checkedPermissions.value;
            message("权限保存成功", { type: "success" });
            done();
          } else {
            message(res.msg || "权限保存失败", { type: "error" });
          }
        })
        .catch(() => {
          message("权限保存失败", { type: "error" });
        });
    }
  });
};

const addRole = async () => {
  try {
    const { value } = await ElMessageBox.prompt("请输入角色名称", "新增角色", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /\S+/,
      inputErrorMessage: "角色名称不能为空"
    });
    const res = await createRoleApi({ name: value });
    if (res.code === 200) {
      message("新增成功", { type: "success" });
      loadData();
    } else {
      message(res.msg || "新增失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("新增失败", { type: "error" });
    }
  }
};

const deleteRole = async (role: Role) => {
  if (role.isSystem) {
    message("系统角色不能删除", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const res = await deleteRoleApi(role.uid);
    if (res.code === 200) {
      roleList.value = roleList.value.filter(r => r.uid !== role.uid);
      message("删除成功", { type: "success" });
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch {
    // cancelled
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-4 rounded-md">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="用户管理" name="users">
          <PureTableBar title="用户列表" @refresh="loadData">
            <template #buttons>
              <el-button
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="openUserDialog()"
              >
                新增用户
              </el-button>
            </template>
            <template v-slot="{ size }">
              <pure-table
                border
                adaptive
                row-key="uid"
                alignWhole="center"
                showOverflowTooltip
                :loading="loading"
                :data="userList"
                :columns="userColumns"
              >
                <template #operation="{ row }">
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="openUserDialog('修改', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    @click="deleteUser(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <el-tab-pane label="角色权限设置" name="roles">
          <div class="flex justify-end mb-4">
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="addRole"
            >
              新增角色
            </el-button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <el-card
              v-for="role in roleList"
              :key="role.uid"
              class="role-card"
              shadow="hover"
            >
              <template #header>
                <div class="flex justify-between items-center">
                  <span class="font-medium">{{ role.name }}</span>
                  <div>
                    <el-button
                      link
                      type="primary"
                      :icon="useRenderIcon(Setting)"
                      @click="openRolePermissionDialog(role)"
                    >
                      权限设置
                    </el-button>
                    <el-button
                      v-if="!role.isSystem"
                      link
                      type="danger"
                      :icon="useRenderIcon(Delete)"
                      @click="deleteRole(role)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="text-sm text-gray-500">
                {{ role.description || "暂无描述" }}
              </div>
              <div class="mt-2 text-xs text-gray-400">
                <el-tag v-if="role.isSystem" type="info" size="small">
                  系统角色
                </el-tag>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.role-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }
}
</style>
