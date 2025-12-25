/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
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
