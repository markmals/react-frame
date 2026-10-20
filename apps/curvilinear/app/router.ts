import { render, serverActions } from "react-frame/vite/server";
import { asyncContext } from "remix/middleware/async-context";
import { compression } from "remix/middleware/compression";
import { logger } from "remix/middleware/logger";
import { createMiddleware, createRouter, type MiddlewareContext } from "remix/router";

import apiController from "./actions/api/controller.tsx";
import rootController from "./actions/controller.tsx";
import framesController from "./actions/frames/controller.tsx";
import { loadDatabase } from "./middleware/database.ts";
import { loadQueryClient } from "./middleware/query-client.tsx";
import { routes } from "./routes.ts";

// The app has no sign-in, so there is no session middleware: render() adds context.render(),
// loadQueryClient() wraps it so every response carries one <HydrationBoundary>, asyncContext()
// lets server functions reach the database, and serverActions() runs them.
const appMiddleware = createMiddleware(
  render(),
  loadQueryClient(),
  asyncContext(),
  loadDatabase(),
  serverActions(),
);

type AppContext = MiddlewareContext<typeof appMiddleware>;

declare module "remix" {
  interface RouterTypes {
    context: AppContext;
  }
}

export function createCurvilinearRouter() {
  let middleware = [];

  if (process.env.NODE_ENV === "development") {
    middleware.push(logger());
  }

  middleware.push(compression());
  middleware.push(...appMiddleware);

  let router = createRouter<AppContext>({ middleware });

  router.map(routes, rootController);
  router.map(routes.frames, framesController);
  router.map(routes.api, apiController);

  return router;
}
