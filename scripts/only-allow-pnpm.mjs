const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.includes("pnpm/")) {
  console.error(
    [
      "This project requires pnpm.",
      "",
      `Detected user agent: ${userAgent || "<empty>"}`,
      "",
      "Fix:",
      "  corepack enable",
      "  corepack prepare pnpm@10 --activate",
      "  pnpm install"
    ].join("\n")
  );
  process.exit(1);
}
