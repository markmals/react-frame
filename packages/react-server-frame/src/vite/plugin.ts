import * as path from "node:path";
import { fileURLToPath } from "node:url";

import * as Vite from "vite";

import { findClientModules } from "./find-client-modules.ts";

function getEntry(file: string) {
  return Vite.normalizePath(path.join(path.dirname(fileURLToPath(import.meta.url)), file));
}

export function reactServerFrame({ entry = "/src/entry.server" }: { entry?: string } = {}) {
  return [
    {
      name: "framework",
      // Vite merges what config hooks return into the user's config, so return only additions;
      // returning the merged config would duplicate every array in it, like `test.projects`.
      config() {
        return {
          environments: {
            client: {
              build: { rolldownOptions: { input: { index: getEntry("entry.client.tsx") } } },
            },
            rsc: {
              build: { rolldownOptions: { input: { index: entry } } },
            },
            ssr: {
              build: { rolldownOptions: { input: { index: getEntry("entry.ssr.tsx") } } },
            },
          },
        } satisfies Vite.UserConfig;
      },
    },
    {
      name: "framework:optimize-deps",
      async configEnvironment(name) {
        if (name !== "client") return;

        const entries = new Set<string>([getEntry("entry.client.tsx")]);

        try {
          for (const file of await findClientModules(".")) {
            entries.add(file);
          }
          console.log(`Optimizing dependencies for ${entries.size} client modules`);
        } catch (error) {
          console.warn("Could not discover client modules for dependency optimization", error);
        }

        return { optimizeDeps: { entries: [...entries] } } satisfies Vite.EnvironmentOptions;
      },
    },
  ] satisfies Vite.Plugin[];
}
