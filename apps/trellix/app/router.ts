import { render, serverActions } from "react-frame/vite/server";
import { asyncContext } from "remix/middleware/async-context";
import { compression } from "remix/middleware/compression";
import { logger } from "remix/middleware/logger";
import { session } from "remix/middleware/session";
import { createMiddleware, createRouter, type MiddlewareContext } from "remix/router";

import loginController from "./actions/auth/login/controller.tsx";
import signupController from "./actions/auth/signup/controller.tsx";
import boardController from "./actions/board/controller.tsx";
import boardsController from "./actions/boards/controller.tsx";
import rootController from "./actions/controller.tsx";
import { loadAuth } from "./middleware/auth.ts";
import { loadDatabase } from "./middleware/database.ts";
import { sessionCookie, sessionStorage } from "./middleware/session.ts";
import { routes } from "./routes.ts";

// render() wraps session() so a page rendered after a server function sees the saved session;
// serverActions() comes last so server functions see the session and the signed-in account.
const appMiddleware = createMiddleware(
  render(),
  session(sessionCookie, sessionStorage),
  asyncContext(),
  loadDatabase(),
  loadAuth(),
  serverActions(),
);

type AppContext = MiddlewareContext<typeof appMiddleware>;

declare module "remix" {
  interface RouterTypes {
    context: AppContext;
  }
}

export function createTrellixRouter() {
  let middleware = [];

  if (process.env.NODE_ENV === "development") {
    middleware.push(logger());
  }

  middleware.push(compression());
  middleware.push(...appMiddleware);

  let router = createRouter<AppContext>({ middleware });

  router.map(routes, rootController);
  router.map(routes.auth.login, loginController);
  router.map(routes.auth.signup, signupController);
  router.map(routes.boards, boardsController);
  router.map(routes.board, boardController);

  return router;
}
