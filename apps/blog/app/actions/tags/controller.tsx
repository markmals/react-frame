import { createController } from "remix/router";

import { listPosts } from "../../content.ts";
import { routes } from "../../routes.ts";
import { NotFoundPage } from "../../ui/not-found.tsx";
import { TagPage } from "./page.tsx";

export default createController(routes.tags, {
  actions: {
    async show({ params, render }) {
      let posts = await listPosts({ tag: params.tag });

      if (posts.length === 0) {
        return render(
          <NotFoundPage title={`Nothing tagged #${params.tag}`}>
            <p>No post carries that tag. The tag list in the sidebar has the ones that exist.</p>
          </NotFoundPage>,
          { status: 404 },
        );
      }

      return render(<TagPage tag={params.tag} count={posts.length} />);
    },
  },
});
