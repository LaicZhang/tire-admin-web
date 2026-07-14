import fs from "node:fs";
import path from "node:path";

export function resolveWorkspaceRoot(fromDir: string): string {
  let current = path.resolve(fromDir);

  while (true) {
    const docsSettingsCsv = path.join(current, "docs", "settings.csv");
    const beCoreDir = path.join(current, "be-core");
    if (fs.existsSync(docsSettingsCsv) && fs.existsSync(beCoreDir)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `Failed to resolve workspace root from "${fromDir}": docs/settings.csv not found in ancestor directories`
      );
    }
    current = parent;
  }
}
