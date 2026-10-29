const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.includes("pnpm/")) {
  console.error(
    [
      "This project requires pnpm.",
      "",
      `Detected user agent: ${userAgent || "<empty>"}`,
      "",
      "Fix:",
      // Node 26 不再随发行版分发 Corepack，`corepack enable` 已不可用；
      // 版本与 package.json 的 packageManager(pnpm@12.10.1) 保持一致。
      "  npm install -g pnpm@12.10.1",
      "  pnpm install"
    ].join("\n")
  );
  process.exit(1);
}
