import { computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import {
  MONITOR_EXPORT_PERM,
  MONITOR_TAB_PERMS,
  type MonitorCenterMode,
  type MonitorTabKey
} from "./types";

function normalizeRoles(roles: string[]): string[] {
  return roles.map(r => r.trim().toLowerCase()).filter(Boolean);
}

/**
 * 平台中心：admin 全开。
 * 公司中心：boss/admin 全开；其余角色按 meta.auths / permissions 权限码判断。
 */
export function useMonitorPerm(mode: MonitorCenterMode) {
  const userStore = useUserStoreHook();

  const roles = computed(() => normalizeRoles(userStore.roles ?? []));
  const permissions = computed(() => userStore.permissions ?? []);

  const isPlatformAdmin = computed(() => roles.value.includes("admin"));
  const isBoss = computed(() => roles.value.includes("boss"));

  function hasApiPerm(code: string | null): boolean {
    if (!code) return true;
    if (mode === "platform") return isPlatformAdmin.value;
    if (isPlatformAdmin.value || isBoss.value) return true;
    return permissions.value.includes(code);
  }

  function canShowTab(tab: MonitorTabKey): boolean {
    // 平台页由路由硬绑 admin；公司侧按权限码
    if (mode === "platform") return true;
    return hasApiPerm(MONITOR_TAB_PERMS[tab]);
  }

  const canExport = computed(() =>
    mode === "platform"
      ? isPlatformAdmin.value
      : hasApiPerm(MONITOR_EXPORT_PERM)
  );

  const visibleTabs = computed(() => {
    const all: Array<{ key: MonitorTabKey; label: string }> = [
      { key: "overview", label: "概览" },
      { key: "org", label: "身份组织" },
      { key: "logs", label: "访问与操作" },
      { key: "business", label: "业务动态" },
      { key: "system", label: "系统健康" },
      { key: "money", label: "资金合规" }
    ];
    if (mode === "platform") return all;
    return all.filter(t => canShowTab(t.key));
  });

  return {
    isPlatformAdmin,
    isBoss,
    canExport,
    canShowTab,
    hasApiPerm,
    visibleTabs
  };
}
