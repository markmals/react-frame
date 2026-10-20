import { render, serverActions } from "react-frame/vite/server";
import { asyncContext } from "remix/middleware/async-context";
import { compression } from "remix/middleware/compression";
import { logger } from "remix/middleware/logger";
import { session } from "remix/middleware/session";
import { createMiddleware, createRouter, type MiddlewareContext } from "remix/router";

import accountController from "./actions/account/controller.tsx";
import accountOrdersController from "./actions/account/orders/controller.tsx";
import accountSettingsController from "./actions/account/settings/controller.tsx";
import adminBooksController from "./actions/admin/books/controller.tsx";
import adminController from "./actions/admin/controller.tsx";
import adminOrdersController from "./actions/admin/orders/controller.tsx";
import adminUsersController from "./actions/admin/users/controller.tsx";
import authForgotPasswordController from "./actions/auth/forgot-password/controller.tsx";
import authLoginController from "./actions/auth/login/controller.tsx";
import authRegisterController from "./actions/auth/register/controller.tsx";
import authResetPasswordController from "./actions/auth/reset-password/controller.tsx";
import booksController from "./actions/books/controller.tsx";
import cartController from "./actions/cart/controller.tsx";
import checkoutController from "./actions/checkout/controller.tsx";
import contactController from "./actions/contact/controller.tsx";
import rootController from "./actions/controller.tsx";
import fragmentsController from "./actions/fragments/controller.tsx";
import { loadAuth } from "./middleware/auth.ts";
import { loadDatabase } from "./middleware/database.ts";
import { sessionCookie, sessionStorage } from "./middleware/session.ts";
import { routes } from "./routes.ts";

// Vite serves static files and compiled assets, and server functions receive their FormData
// directly, so the demo's staticFiles(), formData(), methodOverride(), and asset middleware
// aren't needed here. render() wraps session() so a page rendered after a server function sees
// the saved session; serverActions() comes last so server functions see the session and auth.
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

export function createBookstoreRouter() {
  let middleware = [];

  if (process.env.NODE_ENV === "development") {
    middleware.push(logger());
  }

  middleware.push(compression());
  middleware.push(...appMiddleware);

  let router = createRouter<AppContext>({ middleware });

  router.map(routes, rootController);
  router.map(routes.fragments, fragmentsController);

  router.map(routes.contact, contactController);

  router.map(routes.books, booksController);
  router.map(routes.auth.login, authLoginController);
  router.map(routes.auth.register, authRegisterController);
  router.map(routes.auth.forgotPassword, authForgotPasswordController);
  router.map(routes.auth.resetPassword, authResetPasswordController);
  router.map(routes.cart, cartController);
  router.map(routes.account, accountController);
  router.map(routes.account.settings, accountSettingsController);
  router.map(routes.account.orders, accountOrdersController);
  router.map(routes.checkout, checkoutController);
  router.map(routes.admin, adminController);
  router.map(routes.admin.books, adminBooksController);
  router.map(routes.admin.users, adminUsersController);
  router.map(routes.admin.orders, adminOrdersController);

  return router;
}
