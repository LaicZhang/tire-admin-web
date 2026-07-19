import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);

const oneShotBuildInfo =
  "node_modules/.cache/typecheck/admin.tsbuildinfo";
const watchBuildInfo =
  "node_modules/.cache/typecheck/admin-watch.tsbuildinfo";

test("typecheck launches one complete incremental vue-tsc scan", () => {
  assert.equal(
    packageJson.scripts.typecheck,
    `vue-tsc --noEmit --skipLibCheck --incremental --tsBuildInfoFile ${oneShotBuildInfo}`
  );
});

test("typecheck:watch launches vue-tsc in watch mode with a distinct cache", () => {
  assert.equal(
    packageJson.scripts["typecheck:watch"],
    `vue-tsc --watch --noEmit --skipLibCheck --incremental --tsBuildInfoFile ${watchBuildInfo}`
  );
  assert.notEqual(oneShotBuildInfo, watchBuildInfo);
});
