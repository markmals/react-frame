import { createFileResponse as sendFile } from "remix/response/file";
import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { uploadsStorage } from "../utils/uploads.ts";
import { AboutPage } from "./about.tsx";
import { HomePage } from "./home.tsx";
import { SearchPage } from "./search.tsx";

export default createController(routes, {
  actions: {
    async uploads({ request, params }) {
      let file = await uploadsStorage.get(params.key);

      if (!file) {
        return new Response("File not found", { status: 404 });
      }

      return sendFile(file, request, {
        cacheControl: "public, max-age=31536000",
      });
    },

    home({ render }) {
      return render(<HomePage />, {
        headers: { "Cache-Control": "no-store" },
      });
    },

    about({ render }) {
      return render(<AboutPage />);
    },

    search({ render, url }) {
      return render(<SearchPage query={url.searchParams.get("q") ?? ""} />);
    },
  },
});
