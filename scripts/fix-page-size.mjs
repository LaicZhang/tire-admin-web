import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        walkDir(filePath, fileList);
      }
    } else if (/\.(vue|ts|tsx)$/.test(file) && file !== 'constants.ts') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);

let totalReplacements = 0;
const changedFiles = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  const originalContent = content;
  let hasChanges = false;
  const fileReplacements = { small: 0, medium: 0, default: 0 };

  // Replace pageSize: 10 with PAGE_SIZE_SMALL
  const matches10 = content.match(/pageSize:\s*10(?=[,\s\r\n}])/g);
  if (matches10) {
    content = content.replace(/pageSize:\s*10(?=[,\s\r\n}])/g, 'pageSize: PAGE_SIZE_SMALL');
    fileReplacements.small = matches10.length;
    hasChanges = true;
  }

  // Replace pageSize: 15 with PAGE_SIZE_MEDIUM
  const matches15 = content.match(/pageSize:\s*15(?=[,\s\r\n}])/g);
  if (matches15) {
    content = content.replace(/pageSize:\s*15(?=[,\s\r\n}])/g, 'pageSize: PAGE_SIZE_MEDIUM');
    fileReplacements.medium = matches15.length;
    hasChanges = true;
  }

  // Replace pageSize: 20 with DEFAULT_PAGE_SIZE
  const matches20 = content.match(/pageSize:\s*20(?=[,\s\r\n}])/g);
  if (matches20) {
    content = content.replace(/pageSize:\s*20(?=[,\s\r\n}])/g, 'pageSize: DEFAULT_PAGE_SIZE');
    fileReplacements.default = matches20.length;
    hasChanges = true;
  }

  if (hasChanges) {
    // Determine relative import path
    const fileDir = path.dirname(file);
    let relativePath = path.relative(fileDir, path.join(srcDir, 'utils', 'constants')).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    // Check which constants are needed
    const needsSmall = fileReplacements.small > 0 && !originalContent.includes('PAGE_SIZE_SMALL');
    const needsMedium = fileReplacements.medium > 0 && !originalContent.includes('PAGE_SIZE_MEDIUM');
    const needsDefault = fileReplacements.default > 0 && !originalContent.includes('DEFAULT_PAGE_SIZE');

    const neededImports = [];
    if (needsSmall) neededImports.push('PAGE_SIZE_SMALL');
    if (needsMedium) neededImports.push('PAGE_SIZE_MEDIUM');
    if (needsDefault) neededImports.push('DEFAULT_PAGE_SIZE');

    if (neededImports.length > 0) {
      // Check if there's already an import from constants
      const existingImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*\/utils\/constants['"]/);

      if (existingImportMatch) {
        // Add to existing import
        const existingImports = existingImportMatch[1].split(',').map(s => s.trim()).filter(s => s);
        const allImports = [...new Set([...existingImports, ...neededImports])];
        content = content.replace(
          existingImportMatch[0],
          `import { ${allImports.join(', ')} } from '${relativePath}'`
        );
      } else {
        // Add new import
        const importStatement = `import { ${neededImports.join(', ')} } from '${relativePath}';\n`;

        // For Vue files, add after <script> tag
        if (file.endsWith('.vue')) {
          if (content.includes('<script')) {
            content = content.replace(
              /(<script[^>]*>\r?\n?)/,
              `$1${importStatement}`
            );
          }
        } else {
          // For TS/TSX files, add after existing imports or at beginning
          const lastImportMatch = content.match(/^(import\s.+[\r\n]+)+/m);
          if (lastImportMatch) {
            const insertPos = lastImportMatch.index + lastImportMatch[0].length;
            content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
          } else {
            content = importStatement + content;
          }
        }
      }
    }

    fs.writeFileSync(file, content, 'utf-8');
    const relFile = path.relative(srcDir, file);
    const count = fileReplacements.small + fileReplacements.medium + fileReplacements.default;
    changedFiles.push({ file: relFile, count });
    totalReplacements += count;
    console.log(`Updated: ${relFile} (${count} replacements)`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total: ${totalReplacements} replacements in ${changedFiles.length} files`);
