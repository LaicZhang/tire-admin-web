import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompress, gzip } from "node:zlib";
import { promisify } from "node:util";
import type { PluginOption, ResolvedConfig } from "vite";

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

const COMPRESSED_SUFFIXES = [".gz", ".br"] as const;

interface CompressMode {
  readonly needGzip: boolean;
  readonly needBrotli: boolean;
  readonly clearOrigin: boolean;
}

function parseCompressMode(compress: ViteCompression): CompressMode {
  const clearOrigin = compress.includes("clear");
  if (compress === "none") {
    return { needGzip: false, needBrotli: false, clearOrigin };
  }
  if (compress.includes("both")) {
    return { needGzip: true, needBrotli: true, clearOrigin };
  }
  if (compress.includes("gzip")) {
    return { needGzip: true, needBrotli: false, clearOrigin };
  }
  if (compress.includes("brotli")) {
    return { needGzip: false, needBrotli: true, clearOrigin };
  }
  throw new Error(`Unknown VITE_COMPRESSION mode: ${compress}`);
}

function isCompressedOutput(filePath: string): boolean {
  return COMPRESSED_SUFFIXES.some(suffix => filePath.endsWith(suffix));
}

async function listFilesRecursively(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function compressOneFile(
  filePath: string,
  mode: CompressMode
): Promise<void> {
  if (isCompressedOutput(filePath)) return;

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) return;

  const source = await readFile(filePath);

  if (mode.needGzip) {
    const gz = await gzipAsync(source);
    await writeFile(`${filePath}.gz`, gz);
  }

  if (mode.needBrotli) {
    const br = await brotliCompressAsync(source);
    await writeFile(`${filePath}.br`, br);
  }

  if (mode.clearOrigin) {
    await rm(filePath);
  }
}

function createCompressionPlugin(
  compress: ViteCompression
): PluginOption | null {
  const mode = parseCompressMode(compress);
  if (!mode.needGzip && !mode.needBrotli) return null;

  let resolved: ResolvedConfig;
  return {
    name: "vite:static-compress",
    apply: "build",
    configResolved(config) {
      resolved = config;
    },
    async closeBundle() {
      const outDir = resolve(resolved.root, resolved.build.outDir);
      const files = await listFilesRecursively(outDir);
      await Promise.all(files.map(file => compressOneFile(file, mode)));
    }
  };
}

export const configCompressPlugin = (compress: ViteCompression): PluginOption =>
  createCompressionPlugin(compress);
