// 权限设置 - 类型定义
export interface PermissionUser {
  uid: string;
  username: string;
  phone: string;
  email: string;
  roleId: string;
  roleName: string;
  status: "1" | "0";
  createTime: string;
  lastLoginTime: string;
}

export interface Role {
  uid: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createTime: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  children?: PermissionItem[];
}

export interface PermissionItem {
  id: string;
  name: string;
  code: string;
}

export interface UserFormProps {
  formInline: {
    uid?: string;
    username: string;
    phone: string;
    roleId: string;
    warehouseIds: string[];
  };
}

export interface RoleFormProps {
  formInline: {
    uid?: string;
    name: string;
    description: string;
    permissions: string[];
  };
}
