import * as fs from "node:fs/promises";
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: true,
    exports: {
      // `index.client` is only reached through the root export's default condition.
      exclude: ["index.client"],
      // React Server Components resolve the server `<Frame>`; everything else, like a single-page
      // app, gets the one that resolves in the browser. Both share the server entry's types.
      customExports(exports) {
        exports["."] = {
          types: "./dist/index.d.mts",
          "react-server": "./dist/index.mjs",
          default: "./dist/index.client.mjs",
        };
        return exports;
      },
    },
    entry: {
      index: "./src/index.ts",
      "index.client": "./src/index.client.ts",
      browser: "./src/browser.tsx",
      client: "./src/client.tsx",
      spa: "./src/spa.tsx",
      "vite/browser": "./src/vite/browser.ts",
      "vite/plugin": "./src/vite/plugin.ts",
      "vite/server": "./src/vite/server.ts",
    },
    hooks: {
      async "build:done"() {
        await Promise.all([
          fs.copyFile("src/vite/entry.client.tsx", "dist/vite/entry.client.tsx"),
          fs.copyFile("src/vite/entry.ssr.tsx", "dist/vite/entry.ssr.tsx"),
        ]);
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
