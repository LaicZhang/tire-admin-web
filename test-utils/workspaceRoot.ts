import fs from "node:fs";
import path from "node:path";

export function tryResolveWorkspaceRoot(fromDir: string): string | undefined {
  let current = path.resolve(fromDir);

  while (true) {
    const backendSettingsCsv = path.join(
      current,
      "be-core",
      "docs",
      "settings.csv"
    );
    if (fs.existsSync(backendSettingsCsv)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function resolveWorkspaceRoot(fromDir: string): string {
  const workspaceRoot = tryResolveWorkspaceRoot(fromDir);
  if (workspaceRoot !== undefined) return workspaceRoot;

  throw new Error(
    `Failed to resolve workspace root from "${fromDir}": be-core/docs/settings.csv not found in ancestor directories`
  );
}
