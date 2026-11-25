// @ts-check

/** @type {import("stylelint").Config} */
export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/vue.js",
    "stylelint-config-recess-order",
    // 顶层引入：让 .vue 的 <style lang="scss"> 也受 scss/* 规则约束
    "stylelint-config-recommended-vue/scss/index.js"
  ],
  plugins: ["stylelint-scss", "stylelint-order"],
  overrides: [
    {
      // 仅 html/vue 需要 postcss-html；.css 走默认 CSS 解析器才会被真正检查
      files: ["**/*.{html,vue}"],
      customSyntax: "postcss-html"
    },
    {
      files: ["*.scss", "**/*.scss"],
      customSyntax: "postcss-scss",
      extends: ["stylelint-config-standard-scss"]
    },
    {
      // Tailwind v4 的 CSS 入口文件：@import 必须是字符串形式，
      // 主题变量名（--color-bg_color）对应工具类名，不能改成 kebab-case
      files: ["src/style/tailwind.css"],
      rules: {
        "import-notation": "string",
        "custom-property-pattern": null
      }
    }
  ],
  rules: {
    "selector-class-pattern": null,
    "no-descending-specificity": null,
    "scss/dollar-variable-pattern": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["deep", "global"]
      }
    ],
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["v-deep", "v-global", "v-slotted"]
      }
    ],
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "function",
          "if",
          "each",
          "include",
          "mixin",
          "use",
          "extend",
          // Tailwind CSS v4 指令
          "theme",
          "utility",
          "custom-variant",
          "source",
          "plugin",
          "config",
          "reference"
        ]
      }
    ],
    // @apply / @tailwind 等指令的 prelude 是工具类名列表，不是 CSS 值；
    // Sass 指令（@mixin/@include/@if…）的 prelude 是 SassScript，同样不适用
    "at-rule-prelude-no-invalid": [
      true,
      {
        ignoreAtRules: [
          "media",
          "apply",
          "tailwind",
          "screen",
          "variants",
          "responsive",
          "theme",
          "utility",
          "custom-variant",
          "source",
          "plugin",
          "config",
          "reference",
          "mixin",
          "include",
          "function",
          "if",
          "else",
          "each",
          "for",
          "while",
          "use",
          "forward",
          "extend",
          "at-root",
          "return",
          "content",
          "debug",
          "warn",
          "error"
        ]
      }
    ],
    "rule-empty-line-before": [
      "always",
      {
        ignore: ["after-comment", "first-nested"]
      }
    ],
    "unit-no-unknown": [true, { ignoreUnits: ["rpx"] }],
    "order/order": [
      [
        "dollar-variables",
        "custom-properties",
        "at-rules",
        "declarations",
        {
          type: "at-rule",
          name: "supports"
        },
        {
          type: "at-rule",
          name: "media"
        },
        "rules"
      ],
      { severity: "warning" }
    ]
  },
  ignoreFiles: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx", "report.html"]
};
