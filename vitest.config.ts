/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [vue(), vueJsx(), Icons({ compiler: "vue3", autoInstall: true })],
  test: {
    globals: true,
    environment: "happy-dom",
    env: {
      VITE_ROUTER_HISTORY: "hash"
    },
    setupFiles: ["tests/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,ts,tsx}",
      "tests/**/*.{test,spec}.{js,ts,tsx}"
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/**/*.d.ts"]
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@build": resolve(__dirname, "build")
    }
  }
});
