import { createController } from "remix/router";

import { findAuthor, findPost } from "../../content.ts";
import { routes } from "../../routes.ts";
import { NotFoundPage } from "../../ui/not-found.tsx";
import { ShowPage } from "./show-page.tsx";

export default createController(routes.posts, {
  actions: {
    async show({ params, render }) {
      let post = await findPost(params.slug);

      if (post === undefined) {
        return render(
          <NotFoundPage title="No such post">
            <p>
              There is nothing published at <code>/posts/{params.slug}</code>. It may have been a
              draft that never shipped.
            </p>
          </NotFoundPage>,
          { status: 404 },
        );
      }

      let author = await findAuthor(post.authorId);

      return render(<ShowPage post={post} author={author} />);
    },
  },
});
