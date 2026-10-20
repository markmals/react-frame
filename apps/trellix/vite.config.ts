import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { reactFrame } from "react-frame/vite/plugin";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  server: {
    port: 44600,
  },
  plugins: [
    reactFrame({ entry: "/app/entry.server.ts" }),
    tailwindcss(),
    react({ compiler: true }),
    rsc(),
  ],
  test: {
    projects: [
      // Server tests run the app on a dev server of their own (test/helpers.ts), and browser
      // tests render client components, which only need React's plugin, so neither inherits this
      // config's plugins.
      { extends: false, test: { name: "server", include: ["app/**/*.test.ts"] } },
      {
        extends: false,
        plugins: [react({ compiler: true })],
        test: {
          name: "browser",
          include: ["app/**/*.test.browser.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
