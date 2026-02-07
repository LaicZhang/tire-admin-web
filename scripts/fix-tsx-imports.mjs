import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix - these have broken import statements
const filesToFix = [
  'src/views/system/role/columns.tsx',
  'src/views/system/permission/columns.tsx',
  'src/views/system/menu/columns.tsx',
  'src/views/system/companies/columns.tsx',
  'src/views/auth/columns.tsx'
];

const rootDir = path.join(__dirname, '..');

filesToFix.forEach(relPath => {
  const filePath = path.join(rootDir, relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix pattern: import type {\nimport { X } from '...constants';\n  ... } from "@pureadmin/table";
  // Should be: import { X } from '...constants';\nimport type { ... } from "@pureadmin/table";

  // Match pattern for PAGE_SIZE_SMALL
  const patternSmall = /import type \{\r?\nimport \{ PAGE_SIZE_SMALL \} from '([^']+)';\r?\n(\s*\w+,?\r?\n)*\} from "@pureadmin\/table";/;

  // Match pattern for DEFAULT_PAGE_SIZE
  const patternDefault = /import type \{\r?\nimport \{ DEFAULT_PAGE_SIZE \} from '([^']+)';\r?\n(\s*\w+,?\r?\n)*\} from "@pureadmin\/table";/;

  if (patternSmall.test(content)) {
    // Extract the types that were being imported
    const match = content.match(/import type \{\r?\nimport \{ PAGE_SIZE_SMALL \} from '([^']+)';\r?\n([\s\S]*?)\} from "@pureadmin\/table";/);
    if (match) {
      const importPath = match[1];
      const types = match[2].split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('import'))
        .join('\n  ');

      const replacement = `import { PAGE_SIZE_SMALL } from '${importPath}';\nimport type {\n  ${types}\n} from "@pureadmin/table";`;

      content = content.replace(match[0], replacement);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${relPath} (PAGE_SIZE_SMALL)`);
    }
  } else if (patternDefault.test(content)) {
    const match = content.match(/import type \{\r?\nimport \{ DEFAULT_PAGE_SIZE \} from '([^']+)';\r?\n([\s\S]*?)\} from "@pureadmin\/table";/);
    if (match) {
      const importPath = match[1];
      const types = match[2].split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('import'))
        .join('\n  ');

      const replacement = `import { DEFAULT_PAGE_SIZE } from '${importPath}';\nimport type {\n  ${types}\n} from "@pureadmin/table";`;

      content = content.replace(match[0], replacement);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${relPath} (DEFAULT_PAGE_SIZE)`);
    }
  } else {
    console.log(`No matching pattern found in: ${relPath}`);
  }
});

console.log('\nDone!');
