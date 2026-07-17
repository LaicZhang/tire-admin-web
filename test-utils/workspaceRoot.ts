import fs from "node:fs";
import path from "node:path";

export function resolveWorkspaceRoot(fromDir: string): string {
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
    if (parent === current) {
      throw new Error(
        `Failed to resolve workspace root from "${fromDir}": be-core/docs/settings.csv not found in ancestor directories`
      );
    }
    current = parent;
  }
}
