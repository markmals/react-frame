import { createController } from "remix/router";

import { parseIssueFilters } from "../../data/filters.ts";
import { countIssuesByStatus } from "../../data/issue-queries.ts";
import { Issues } from "../../data/schema.ts";
import { issueCommentsQuery, issueListQuery, issueQuery } from "../../query/options.ts";
import { createRouterLoader } from "../../query/prefetch.ts";
import { routes } from "../../routes.ts";
import { IssueFrame, IssueNotFound } from "./issue.tsx";
import { ListFrame } from "./list.tsx";
import { MenuFrame } from "./menu.tsx";

// Frames are reloaded on their own, so they must never come from a cache.
const frameHeaders = { "Cache-Control": "no-store" };

export default createController(routes.frames, {
  actions: {
    async menu({ db, render }) {
      return render(<MenuFrame counts={await countIssuesByStatus(db)} />, {
        headers: frameHeaders,
      });
    },

    async list(context) {
      let { queryClient, render, url } = context;
      let filters = parseIssueFilters(url.searchParams);

      // Prefetching belongs here, in the loader phase: the renderer dehydrates the cache when
      // render() is called, so a query a server component started would come too late.
      await queryClient.query(issueListQuery(filters, createRouterLoader(context))).catch(ignore);

      return render(
        <ListFrame
          composing={url.searchParams.has("new")}
          filters={filters}
          titleMissing={url.searchParams.get("error") === "title"}
        />,
        { headers: frameHeaders },
      );
    },

    async issue(context) {
      let { db, params, queryClient, render, url } = context;
      let issueId = Number.parseInt(params.issueId, 10);
      let issue = Number.isInteger(issueId) ? await db.find(Issues, issueId) : null;

      if (issue === null) {
        return render(<IssueNotFound />, { status: 404, headers: frameHeaders });
      }

      let loadJson = createRouterLoader(context);
      await Promise.all([
        queryClient.query(issueQuery(issueId, loadJson)).catch(ignore),
        queryClient.query(issueCommentsQuery(issueId, loadJson)).catch(ignore),
      ]);

      return render(
        <IssueFrame
          confirmingDelete={url.searchParams.get("confirm") === "delete"}
          issueId={issueId}
        />,
        { headers: frameHeaders },
      );
    },
  },
});

function ignore() {}
