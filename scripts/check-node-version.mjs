#!/usr/bin/env node
const MIN_NODE_VERSION = [24, 12, 0];

function parseNodeVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`无法解析 Node.js 版本: ${version}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

const currentVersion = process.versions.node;
const current = parseNodeVersion(currentVersion);

if (compareSemver(current, MIN_NODE_VERSION) < 0) {
  console.error(
    [
      "Node.js 版本不满足要求。",
      "",
      `最低要求：>=${MIN_NODE_VERSION.join(".")}`,
      `当前版本：${currentVersion}`,
      "",
      "请升级 Node.js 后重试：",
      "  - 推荐：使用 nvm 切换到本仓库的 .nvmrc 指定版本",
      "  - 或：安装/切换到 Node.js 24.12.0 及以上版本"
    ].join("\n")
  );
  process.exit(1);
}

