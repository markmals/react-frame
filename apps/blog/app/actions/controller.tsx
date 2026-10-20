import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { renderFeed } from "./feed.ts";
import { HomePage } from "./home-page.tsx";

export default createController(routes, {
  actions: {
    home({ render }) {
      return render(<HomePage />);
    },

    // Not a page: the router answers with XML, so the feed is a route like any other.
    async feed({ url }) {
      return new Response(await renderFeed(url.origin), {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": "public, max-age=600",
        },
      });
    },
  },
});
