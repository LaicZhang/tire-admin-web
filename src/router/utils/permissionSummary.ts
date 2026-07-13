export interface ServerPermissionSummary {
  roles: string[];
  permissions: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function collectServerPermissionSummary(
  routes: readonly unknown[],
): ServerPermissionSummary {
  const roles = new Set<string>();
  const permissions = new Set<string>();

  function visit(node: unknown) {
    if (!isRecord(node))
      return;
    const meta = isRecord(node.meta) ? node.meta : undefined;
    if (Array.isArray(meta?.roles)) {
      for (const role of meta.roles) {
        if (typeof role === "string" && role.trim())
          roles.add(role.trim());
      }
    }
    if (Array.isArray(meta?.auths)) {
      for (const permission of meta.auths) {
        if (typeof permission === "string" && permission.trim())
          permissions.add(permission.trim());
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children)
        visit(child);
    }
  }

  for (const route of routes)
    visit(route);

  return {
    roles: [...roles].sort(),
    permissions: [...permissions].sort(),
  };
}
