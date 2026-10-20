import { createController } from "remix/router";

import { findAuthor, listPosts } from "../../content.ts";
import { routes } from "../../routes.ts";
import { NotFoundPage } from "../../ui/not-found.tsx";
import { AuthorPage } from "./page.tsx";

export default createController(routes.authors, {
  actions: {
    async show({ params, render }) {
      let author = await findAuthor(params.authorId);

      if (author === undefined) {
        return render(
          <NotFoundPage title="No such writer">
            <p>Nobody by that name writes here. The sidebar lists everyone who does.</p>
          </NotFoundPage>,
          { status: 404 },
        );
      }

      let posts = await listPosts({ authorId: author.id });

      return render(<AuthorPage author={author} count={posts.length} />);
    },
  },
});
