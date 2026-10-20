import { render, serverActions } from "react-frame/vite/server";
import { asyncContext } from "remix/middleware/async-context";
import { compression } from "remix/middleware/compression";
import { logger } from "remix/middleware/logger";
import { session } from "remix/middleware/session";
import { createMiddleware, createRouter, type MiddlewareContext } from "remix/router";

import authorsController from "./actions/authors/controller.tsx";
import rootController from "./actions/controller.tsx";
import fragmentsController from "./actions/fragments/controller.tsx";
import postsController from "./actions/posts/controller.tsx";
import tagsController from "./actions/tags/controller.tsx";
import { loadDatabase } from "./middleware/database.ts";
import { sessionCookie, sessionStorage } from "./middleware/session.ts";
import { routes } from "./routes.ts";
import { NotFoundPage } from "./ui/not-found.tsx";

// render() wraps session() so a page rendered after a server function sees the session the
// function saved; serverActions() comes last so comment submissions see the session and database.
const appMiddleware = createMiddleware(
  render(),
  session(sessionCookie, sessionStorage),
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

export function createBlogRouter() {
  let middleware = [];

  if (process.env.NODE_ENV === "development") {
    middleware.push(logger());
  }

  middleware.push(compression());
  middleware.push(...appMiddleware);

  let router = createRouter<AppContext>({
    middleware,
    defaultHandler({ render }) {
      return render(
        <NotFoundPage title="Page not found">
          <p>We looked, but there is nothing at this address.</p>
        </NotFoundPage>,
        { status: 404 },
      );
    },
  });

  router.map(routes, rootController);
  router.map(routes.posts, postsController);
  router.map(routes.tags, tagsController);
  router.map(routes.authors, authorsController);
  router.map(routes.fragments, fragmentsController);

  return router;
}
