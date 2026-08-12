import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";
  const manifestFile = isFirefox ? "manifest.firefox.json" : "manifest.json";

  return {
    plugins: [
      react(),
      {
        name: "emit-extension-manifest",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "manifest.json",
            source: readFileSync(resolve(import.meta.dirname, manifestFile), "utf8"),
          });
        },
      },
    ],
    build: {
      outDir: isFirefox ? "dist-firefox" : "dist",
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        input: resolve(import.meta.dirname, "src/content/index.tsx"),
        output: {
          entryFileNames: "content.js",
          codeSplitting: false,
        },
      },
    },
  };
});
