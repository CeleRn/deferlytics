import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: true,
    target: "es2020",
  },
  {
    entry: {
      "bootstrap.iife": "src/bootstrap/bootstrap.ts",
      "loader.iife": "src/browser/loader.ts",
    },
    format: ["iife"],
    globalName: "DeferlyticsBundle",
    dts: false,
    clean: false,
    sourcemap: true,
    minify: true,
    target: "es2020",
    outExtension() {
      return { js: ".js" };
    },
  },
]);
