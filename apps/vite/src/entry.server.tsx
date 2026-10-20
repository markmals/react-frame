import { lazy } from "react";
import { mapFrames, useServerMiddleware } from "react-server-frame/vite/frames";
import { useCacheMiddleware } from "vite-plugin-react-use-cache/remix";

import { createCookie } from "remix/cookie";
import { createMemoryFileStorage } from "remix/file-storage/memory";
import { asyncContext } from "remix/middleware/async-context";
import { requireAuth } from "remix/middleware/auth";
import { session } from "remix/middleware/session";
import { redirect } from "remix/response/redirect";
import { createRouter, type RouterContext } from "remix/router";
import { createCookieSessionStorage } from "remix/session-storage/cookie";

import { sessionSecret } from "@/env";
import { routes } from "@/routes";
import { authMiddleware } from "@/lib/auth";

const Home = lazy(() => import("@/frames/home"));
const Protected = lazy(() => import("@/frames/protected"));

const sessionCookie = createCookie("__session", {
  secrets: [sessionSecret],
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
});

const sessionStorage = createCookieSessionStorage();

const router = createRouter({
  middleware: [asyncContext(), session(sessionCookie, sessionStorage), authMiddleware()],
});

export type AppContext = RouterContext<typeof router>;

declare module "remix" {
  interface RouterTypes {
    context: AppContext;
  }
}

mapFrames(router, routes.frames, {
  middleware: [useCacheMiddleware(createMemoryFileStorage()), useServerMiddleware()],
  components: {
    home: Home,
    protected: {
      middleware: [
        requireAuth({
          onFailure() {
            return redirect(routes.frames.home.href());
          },
        }),
      ],
      component: Protected,
    },
  },
});

export default {
  async fetch(request: Request) {
    return router.fetch(new Request(request.url, request));
  },
};
