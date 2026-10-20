import { createServer } from "node:http";

import { staticFiles } from "remix/middleware/static";
import { createRequestListener } from "remix/node-fetch-server";
import { createRouter } from "remix/router";

import type entry from "./src/entry.server.js";

// The server build bundles React, which picks its development or production build from NODE_ENV
// when first loaded. Default to production so it matches the client bundle, then load the build
// dynamically so the default is in place before React evaluates.
process.env.NODE_ENV ??= "production";

// @ts-ignore - may or may not exist yet
const { default: app }: { default: typeof entry } = await import("./dist/rsc/index.js");

const router = createRouter({
  middleware: [
    staticFiles("dist/client", {
      cacheControl: "public, max-age=31536000, immutable",
    }),
  ],
});

router.route("ANY", "*", ({ request }) => app.fetch(request));

const server = createServer(
  createRequestListener(async (request) => {
    try {
      return await router.fetch(request);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

server.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => process.exit(0));
  server.closeAllConnections();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
