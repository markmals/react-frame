import * as http from "node:http";
import { staticFiles } from "remix/middleware/static";
import { createRequestListener } from "remix/node-fetch-server";
import { createRouter } from "remix/router";

import type entry from "./app/entry.server.ts";

// The server build bundles React, which picks its development or production build from NODE_ENV
// when first loaded. Default to production so it matches the client bundle, then load the build
// dynamically so the default is in place before React evaluates.
process.env.NODE_ENV ??= "production";

// @ts-ignore - the build output may not exist yet
const { default: app }: { default: typeof entry } = await import("./dist/rsc/index.js");

const router = createRouter({
  middleware: [staticFiles("dist/client", { cacheControl: "public, max-age=31536000, immutable" })],
});

router.route("ANY", "*", ({ request }) => app.fetch(request));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 44400;

const server = http.createServer(createRequestListener((request) => router.fetch(request)));

server.listen(port, () => {
  console.log(`Marginalia is running on http://localhost:${port}`);
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
