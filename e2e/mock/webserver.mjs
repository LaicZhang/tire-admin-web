import { spawn } from "node:child_process";
import process from "node:process";
import http from "node:http";

const API_PORT = Number.parseInt(process.env.E2E_API_PORT || "19000", 10);

const waitForHealth = async ({ port, timeoutMs }) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ok = await new Promise(resolve => {
      const req = http.get(
        { host: "127.0.0.1", port, path: "/api/__health", timeout: 1000 },
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
  env: {
    ...process.env,
    E2E_API_PORT: String(API_PORT)
  }
});

const ready = await waitForHealth({ port: API_PORT, timeoutMs: 10_000 });
if (!ready) {
  api.kill("SIGTERM");
  throw new Error(`mock api not ready on port ${API_PORT}`);
}

const web = spawn("pnpm", ["dev", "--mode", "e2e"], {
  stdio: "inherit",
  env: process.env
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
