# Oxlint 渐进迁移记录

## 当前边界

第一阶段只增加 Oxlint 的独立检查与 CI advisory job。`pnpm lint:check`、`pnpm lint`、`.lintstagedrc` 和 pre-commit 仍由 ESLint、Stylelint、Oxfmt 按原顺序执行；**Oxlint 失败不会改变现有合入门禁**。请勿在诊断对齐前删除 ESLint 或 Stylelint。

- `pnpm lint:oxlint:check`：只读检查 `src`、`build`、可选的 `mock`（不存在时不报错）。
- `pnpm lint:oxlint`：同样的范围，应用 Oxlint 的安全自动修复；迁移对比时不要运行此命令。
- `pnpm format` 与 `pnpm format:check` 已使用相同的 `src/**/*.{js,ts,json,tsx,css,scss,vue,html,md}` 范围；Oxfmt 只负责格式化，不能取代 Stylelint 的 CSS/SCSS 语义检查。全量 `--write` 前应单独审阅 Vue template、SCSS、Tailwind class 和 ignore 注释的格式差异。

## 显式规则对照

| ESLint                                                   | Oxlint (`.oxlintrc.json`)                | 当前处理                                            |
| -------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- |
| `no-console` (`warn/error` 可用)                         | `no-console`                             | 同样的 warning/allow 选项                           |
| `no-debugger`                                            | `no-debugger`                            | 同样关闭                                            |
| `no-unused-vars` / `@typescript-eslint/no-unused-vars`   | `no-unused-vars`                         | `_` 前缀忽略；TS/Vue 与 ESLint 的作用域分析仍须对比 |
| `@typescript-eslint/ban-ts-comment`                      | `typescript/ban-ts-comment`              | warning                                             |
| `@typescript-eslint/no-explicit-any`                     | `typescript/no-explicit-any`             | error                                               |
| `@typescript-eslint/no-empty-function`                   | `no-empty-function`                      | warning；行为仍须对比                               |
| `@typescript-eslint/no-import-type-side-effects`         | `typescript/no-import-type-side-effects` | error                                               |
| `@typescript-eslint/consistent-type-imports`             | `typescript/consistent-type-imports`     | 保留 `inline-type-imports` 选项                     |
| `@typescript-eslint/no-non-null-assertion`               | `typescript/no-non-null-assertion`       | warning                                             |
| `@typescript-eslint/no-redeclare`                        | `no-redeclare`                           | error；行为仍须对比                                 |
| `@typescript-eslint/prefer-as-const`                     | `typescript/prefer-as-const`             | warning                                             |
| `@typescript-eslint/prefer-literal-enum-member`          | `typescript/prefer-literal-enum-member`  | 保留 bitwise 选项                                   |
| `vue/html-self-closing`、Vue template 推荐规则           | 无等价的内置 Vue template 检查           | **继续由 ESLint 负责**                              |
| SCSS / Vue style / 属性顺序 / Tailwind / `:deep` / `rpx` | 无对应 CSS linter                        | **继续由 Stylelint 负责**                           |

Oxlint 的内置 Vue 插件针对 `<script>`，不能把 Vue template 检查视为已迁移。现有 ESLint 的 `typescript-eslint` recommended 规则也尚未逐一对照，不应只凭上述显式规则表关闭 ESLint。

## 诊断基线（2026-10-01）

在相同工作树上检查 `src` 和 `build`（`mock` 当前不存在；忽略声明文件、`src/assets`、`src/**/iconfont`）：

| 工具                              | 扫描文件 | errors | warnings | 退出码 |
| --------------------------------- | -------: | -----: | -------: | -----: |
| ESLint `--no-cache --format json` |     1199 |      0 |        7 |      0 |
| Oxlint `--format json`            |     1197 |      1 |       16 |      1 |

Oxlint 多出的 error 是 `build/utils.ts:94` 的 `no-unused-vars`：ESLint 对同一文件返回 0，需先分析作用域差异，再决定改代码、定向忽略或调整规则。两者均发现 6 个 non-null assertion warning；ESLint 另外报告 `src/views/business/stockTaking/index.vue` 的 `vue/no-lone-template`，Oxlint 不报告。Oxlint 的其他 10 条 warning 来自额外启用的 correctness 规则，并非 ESLint 诊断的等价映射。扫描文件数差异来自 `src/utils/http/types.d.ts` 和 `src/utils/localforage/types.d.ts`：ESLint 的当前 glob 仍计入这两个声明文件，而 Oxlint 配置明确忽略 `**/*.d.ts`；两者均无该文件诊断。

复测（输出 JSON，按 `diagnostics[].severity` / ESLint 的 `errorCount`、`warningCount` 统计，分别记录退出码）：

```sh
pnpm exec eslint --no-cache --format json 'src/**/*.{vue,js,ts,tsx}' 'build/**/*.{vue,js,ts,tsx}' > /tmp/tire-eslint.json
pnpm exec oxlint --no-error-on-unmatched-pattern --format json src build mock > /tmp/tire-oxlint.json
```

## 后续升门禁前的检查清单

1. 对比规则、严重级别、作用域及退出码，处理上述差异；针对 `no-unused-vars`、`no-explicit-any`、type-only import、non-null assertion、enum、Vue compiler macros/自动导入构造正反例。不要用 Oxlint 自动修复掩盖诊断差异。
2. 对实际 Vue `<script setup lang="ts">` 及 template 分别验证；ESLint 的 `vue/html-self-closing` 和其他模板规则保持运行。比较 ESLint 与 Oxlint 的覆盖范围后，才逐项缩减重复规则。
3. 保留 Stylelint 的 Vue style/SCSS nested rule、`:deep`、`v-deep`、`v-slotted`、Tailwind at-rule、`rpx`、属性排序和 `.stylelintignore` 检查；Oxfmt 不替代这些规则。
4. 验证 pre-commit 的 lint-staged、`pnpm typecheck && pnpm lint:check && pnpm test && pnpm build --mode staging`，以及 CI mock E2E 和 production build。待 Oxlint 稳定且团队同意后，再将 advisory job 变成必过、考虑调整 lint-staged 和 ESLint 的重叠规则。