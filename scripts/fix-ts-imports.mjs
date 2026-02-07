import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");

// Pattern: import {\nimport { CONSTANT } from '...constants';\n  ...}
// Should be: import { CONSTANT } from '...constants';\nimport { ... }

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes("node_modules") && !file.startsWith(".")) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const tsFiles = walkDir(srcDir);
let fixedCount = 0;

tsFiles.forEach(file => {
  let content = fs.readFileSync(file, "utf-8");
  const originalContent = content;

  // Pattern 1: import { \nimport { CONSTANT } from '...constants';\n  item1,
  const pattern1 =
    /import \{\r?\nimport \{ (PAGE_SIZE_SMALL|PAGE_SIZE_MEDIUM|DEFAULT_PAGE_SIZE) \} from '([^']+)';\r?\n(\s+\w+)/g;

  if (pattern1.test(content)) {
    content = content.replace(
      pattern1,
      (match, constant, importPath, firstItem) => {
        return `import { ${constant} } from '${importPath}';\nimport {\n${firstItem}`;
      }
    );
  }

  // Pattern 2: import type {\nimport { CONSTANT } from '...constants';\n  item1,
  const pattern2 =
    /import type \{\r?\nimport \{ (PAGE_SIZE_SMALL|PAGE_SIZE_MEDIUM|DEFAULT_PAGE_SIZE) \} from '([^']+)';\r?\n(\s+\w+)/g;

  if (pattern2.test(content)) {
    content = content.replace(
      pattern2,
      (match, constant, importPath, firstItem) => {
        return `import { ${constant} } from '${importPath}';\nimport type {\n${firstItem}`;
      }
    );
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf-8");
    const relPath = path.relative(srcDir, file);
    console.log(`Fixed: ${relPath}`);
    fixedCount++;
  }
});

console.log(`\nTotal fixed: ${fixedCount} files`);
