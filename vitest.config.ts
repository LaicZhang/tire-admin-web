/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Icons from "unplugin-icons/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router"],
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: false
    }),
    Components({
      dirs: [],
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: false
    }),
    vueJsx(),
    Icons({ compiler: "vue3", autoInstall: true })
  ],
  test: {
    globals: true,
    testTimeout: 30000,
    reporters: [["default", { summary: false }]],
    environment: "happy-dom",
    env: {
      VITE_ROUTER_HISTORY: "hash"
    },
    setupFiles: ["tests/setup.ts"],
    server: {
      deps: {
        inline: [/element-plus/, /plus-pro-components/]
      }
    },
    include: [
      "src/**/*.{test,spec}.{js,ts,tsx}",
      "tests/**/*.{test,spec}.{js,ts,tsx}"
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "istanbul",
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      },
      include: ["src/**/*.{ts,tsx,vue}"],
      reporter: ["text", "json-summary", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/*.{test,spec}.{js,ts,tsx}"
      ]
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@build": resolve(__dirname, "build")
    }
  }
});
