import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { reactServerFrame } from "react-server-frame/vite/plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  server: {
    port: 44100,
  },
  plugins: [
    reactServerFrame({ entry: "/app/entry.server.ts" }),
    tailwindcss(),
    react({ compiler: true }),
    rsc(),
  ],
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
