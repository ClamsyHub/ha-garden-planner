import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
export default defineConfig({
  plugins: [
    {
      name: "runtime-license-notices",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "THIRD_PARTY_NOTICES.txt",
          source: readFileSync("../docs/THIRD_PARTY_NOTICES.txt", "utf8"),
        });
      },
    },
  ],
  build: {
    lib: {
      entry: "src/panel.ts",
      formats: ["es"],
      fileName: () => "garden-planner.js",
    },
    outDir: "../custom_components/garden_planner/www",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
  server: {
    fs: { allow: [".."] },
    port: 5173,
    strictPort: true,
    proxy: { "/__test_api": "http://127.0.0.1:8766" },
  },
});
