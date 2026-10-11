import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";
// Vitest globals keep test files concise.
export default defineConfig({ test: { globals: true, environment: "jsdom", setupFiles: ["./src/test/setup.ts"], exclude: [...configDefaults.exclude, "e2e/**"] }, resolve: { alias: { "@": path.resolve(__dirname, "./src") } } });
