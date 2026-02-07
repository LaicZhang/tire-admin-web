import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Fix CrudPage/index.vue - import inserted into generic attribute
const crudPagePath = path.join(rootDir, "src/components/CrudPage/index.vue");
let content = fs.readFileSync(crudPagePath, "utf-8");

// Pattern: generic with import mistakenly inserted
const brokenPattern =
  /T extends Record<string, unknown>import \{ PAGE_SIZE_SMALL \} from '\.\.\/\.\.\/utils\/constants';\r?\n,\r?\n\s*QueryDto extends Record<string, unknown>/;

if (brokenPattern.test(content)) {
  content = content.replace(
    brokenPattern,
    `T extends Record<string, unknown>,\n    QueryDto extends Record<string, unknown>`
  );

  // Add import after script tag opening ">"
  content = content.replace(
    /(<script[\s\S]*?>\r?\n)/,
    `$1import { PAGE_SIZE_SMALL } from '../../utils/constants';\n`
  );

  fs.writeFileSync(crudPagePath, content, "utf-8");
  console.log("Fixed: CrudPage/index.vue");
} else {
  console.log(
    "Pattern not found in CrudPage/index.vue, checking current state..."
  );
  // Check if already has proper import
  if (
    content.includes("import { PAGE_SIZE_SMALL }") &&
    !content.includes("unknown>import {")
  ) {
    console.log("File appears to already be fixed.");
  } else {
    console.log("Unexpected file state, manual review needed.");
  }
}

// Now find and fix any other Vue files with similar issues
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes("node_modules") && !file.startsWith(".")) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith(".vue")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const srcDir = path.join(rootDir, "src");
const vueFiles = walkDir(srcDir);

console.log("\nChecking for broken imports in Vue files...");

const brokenPatterns = [
  /unknown>import \{ PAGE_SIZE_SMALL \}/,
  /unknown>import \{ PAGE_SIZE_MEDIUM \}/,
  /unknown>import \{ DEFAULT_PAGE_SIZE \}/
];

vueFiles.forEach(file => {
  let content = fs.readFileSync(file, "utf-8");
  let hasIssue = false;

  for (const pattern of brokenPatterns) {
    if (pattern.test(content)) {
      hasIssue = true;
      break;
    }
  }

  if (hasIssue) {
    const relPath = path.relative(srcDir, file);
    console.log(`Broken import found in: ${relPath}`);

    // Fix the pattern - extract the constant name and fix
    const match = content.match(
      /unknown>import \{ (PAGE_SIZE_SMALL|PAGE_SIZE_MEDIUM|DEFAULT_PAGE_SIZE) \} from '([^']+)'/
    );
    if (match) {
      const constantName = match[1];
      const importPath = match[2];

      // Remove the broken part from generic
      content = content.replace(
        new RegExp(
          `unknown>import \\{ ${constantName} \\} from '${importPath.replace(/\//g, "\\/")}';\\r?\\n,`
        ),
        "unknown>,"
      );

      // Add proper import after script tag
      if (
        !content.match(
          new RegExp(`import \\{[^}]*${constantName}[^}]*\\} from`)
        )
      ) {
        content = content.replace(
          /(<script[^>]*>\r?\n)/,
          `$1import { ${constantName} } from '${importPath}';\n`
        );
      }

      fs.writeFileSync(file, content, "utf-8");
      console.log(`Fixed: ${relPath}`);
    }
  }
});

console.log("\nDone!");
