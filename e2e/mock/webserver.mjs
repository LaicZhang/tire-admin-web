import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import process from "node:process";
import http from "node:http";

const API_PORT = Number.parseInt(process.env.E2E_API_PORT || "19000", 10);
const WEB_PORT = Number.parseInt(process.env.E2E_WEB_PORT || "18848", 10);

const buildChildEnv = extraEnv => {
  const env = { ...process.env, ...extraEnv };
  delete env.NODE_OPTIONS;
  return env;
};

const waitForHealth = async ({ port, timeoutMs }) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ok = await new Promise(resolve => {
      const req = http.get(
        { host: "127.0.0.1", port, path: "/api/v1/__health", timeout: 1000 },
        res => {
          res.resume();
          resolve(res.statusCode === 200);
        }
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
};

const api = spawn("node", ["e2e/mock/server.mjs"], {
  stdio: "inherit",
  env: buildChildEnv({ E2E_API_PORT: String(API_PORT) })
});

const ready = await waitForHealth({ port: API_PORT, timeoutMs: 10_000 });
if (!ready) {
  api.kill("SIGTERM");
  throw new Error(`mock api not ready on port ${API_PORT}`);
}

// e2e 模式依赖 `.env.e2e`（VITE_ROUTER_HISTORY / VITE_SERVER_URL 等）。该文件被
// .gitignore 排除，干净 checkout 与 CI 都没有它，缺失时 `getHistoryMode()` 会拿到
// undefined 并抛 "Cannot read properties of undefined (reading 'split')"，页面白屏，
// 所有 mock e2e 因此在 auth.setup 阶段就失败（2026-09-23 起 main 一直红）。
// 这里从 `.env.e2e.example` 补一份，保证 e2e 自带环境、不依赖开发者本地文件。
const envFile = ".env.e2e";
const envExampleFile = ".env.e2e.example";
if (!existsSync(envFile)) {
  if (!existsSync(envExampleFile)) {
    throw new Error(`missing ${envExampleFile}; cannot bootstrap ${envFile}`);
  }
  copyFileSync(envExampleFile, envFile);
  console.log(`[mock-webserver] bootstrapped ${envFile} from ${envExampleFile}`);
}

const web = spawn("pnpm", ["dev", "--mode", "e2e"], {
  stdio: "inherit",
  env: buildChildEnv({ VITE_PORT: String(WEB_PORT) })
});

const shutdown = signal => {
  console.log(`[mock-webserver] received ${signal}, shutting down...`);
  api.kill("SIGTERM");
  web.kill("SIGTERM");
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

api.on("exit", code => {
  if (code && code !== 0) process.exit(code);
});
web.on("exit", code => {
  if (code && code !== 0) process.exit(code);
  process.exit(0);
});
