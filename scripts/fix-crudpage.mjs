import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");

// Fix function for CrudPage specifically
function fixCrudPage() {
  const filePath = path.join(srcDir, "components/CrudPage/index.vue");
  let content = fs.readFileSync(filePath, "utf-8");

  // Check if already fixed
  if (
    content.match(
      /generic="\s*\n\s*T extends Record<string, unknown>,\s*\n\s*QueryDto extends Record<string, unknown>\s*\n\s*"\s*\n>\nimport { PAGE_SIZE_SMALL }/
    )
  ) {
    console.log("CrudPage already fixed");
    return;
  }

  // Look for the broken pattern and fix it
  // The import got inserted after QueryDto line
  const brokenMatch = content.match(
    /(generic="\s*\n\s*T extends Record<string, unknown>,\s*\n\s*QueryDto extends Record<string, unknown>)\s*\n\s*import \{ PAGE_SIZE_SMALL \} from '[^']+';?\s*\n(\s*"\s*\n>)/
  );

  if (brokenMatch) {
    // Move import to after the script tag
    content = content.replace(
      brokenMatch[0],
      brokenMatch[1] +
      "\n  " +
      brokenMatch[2] +
      "\nimport { PAGE_SIZE_SMALL } from '../../utils/constants';\n"
    );
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Fixed: CrudPage/index.vue");
    return;
  }

  console.log("CrudPage pattern not matched, trying alternative fix...");

  // Alternative: just rebuild the header properly
  const headerEndMatch = content.match(
    /import \{ ref, onMounted, computed \} from "vue";/
  );
  if (headerEndMatch) {
    const header = `<script
  setup
  lang="ts"
  generic="
    T extends Record<string, unknown>,
    QueryDto extends Record<string, unknown>
  "
>
import { PAGE_SIZE_SMALL } from '../../utils/constants';
import { ref, onMounted, computed } from "vue";`;

    // Find where the original header ends
    const idx = content.indexOf(
      'import { ref, onMounted, computed } from "vue";'
    );
    if (idx !== -1) {
      // Find the start of that line
      let lineStart = idx;
      while (lineStart > 0 && content[lineStart - 1] !== "\n") {
        lineStart--;
      }
      // Replace everything from start to end of that import
      const endIdx =
        idx + 'import { ref, onMounted, computed } from "vue";'.length;
      content = header + content.slice(endIdx);
      fs.writeFileSync(filePath, content, "utf-8");
      console.log("Fixed: CrudPage/index.vue (alternative method)");
    }
  }
}

// Search for other broken Vue files
function findBrokenVueFiles() {
  const brokenFiles = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!file.includes("node_modules") && !file.startsWith(".")) {
          walkDir(filePath);
        }
      } else if (file.endsWith(".vue")) {
        const content = fs.readFileSync(filePath, "utf-8");
        // Check for import inside generic attribute
        if (content.match(/generic="[\s\S]*?import \{[\s\S]*?\} from/)) {
          brokenFiles.push(filePath);
        }
      }
    });
  }

  walkDir(srcDir);
  return brokenFiles;
}

console.log("Fixing CrudPage...");
fixCrudPage();

console.log("\nSearching for other broken Vue files...");
const brokenFiles = findBrokenVueFiles();
if (brokenFiles.length > 0) {
  console.log("Found broken files:");
  brokenFiles.forEach(f => console.log(`  - ${path.relative(srcDir, f)}`));
} else {
  console.log("No other broken Vue files found.");
}

console.log("\nDone!");
