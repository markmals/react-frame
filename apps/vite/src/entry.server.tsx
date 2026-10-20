import { render, serverActions } from "react-server-frame/vite/server";
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
import Home from "@/frames/home";
import Protected from "@/frames/protected";
import { authMiddleware } from "@/lib/auth";
import { routes } from "@/routes";

const sessionCookie = createCookie("__session", {
  secrets: [sessionSecret],
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
});

const sessionStorage = createCookieSessionStorage();

const router = createRouter({
  middleware: [
    asyncContext(),
    session(sessionCookie, sessionStorage),
    authMiddleware(),
    useCacheMiddleware(createMemoryFileStorage()),
    render(),
    serverActions(),
  ],
});

export type AppContext = RouterContext<typeof router>;

declare module "remix" {
  interface RouterTypes {
    context: AppContext;
  }
}

router.map(routes, {
  actions: {
    home({ render }) {
      return render(<Home />);
    },
    protected: {
      middleware: [
        requireAuth({
          onFailure() {
            return redirect(routes.home.href());
          },
        }),
      ],
      handler({ render }) {
        return render(<Protected />);
      },
    },
  },
});

export default {
  async fetch(request: Request) {
    return router.fetch(new Request(request.url, request));
  },
};
