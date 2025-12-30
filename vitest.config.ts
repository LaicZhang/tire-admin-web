/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [vue(), Icons({ compiler: "vue3", autoInstall: true })],
  test: {
    globals: true,
    environment: "node",
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
