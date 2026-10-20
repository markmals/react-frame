import { createController } from "remix/router";

import { parseIssueFilters } from "../../data/filters.ts";
import { loadComments, loadIssue, loadIssueList } from "../../data/issue-queries.ts";
import { routes } from "../../routes.ts";
import { parseIssueId } from "../../utils/ids.ts";

// These are what TanStack Query's queryFns fetch, so the browser must never reuse a stale copy.
const jsonHeaders = { "Cache-Control": "no-store" };

export default createController(routes.api, {
  actions: {
    async issues({ db, url }) {
      let payload = await loadIssueList(db, parseIssueFilters(url.searchParams));
      return Response.json(payload, { headers: jsonHeaders });
    },

    async issue({ db, params }) {
      let issueId = parseIssueId(params.issueId);
      let issue = issueId === undefined ? null : await loadIssue(db, issueId);

      if (issue === null) {
        return Response.json({ error: "Issue not found" }, { status: 404, headers: jsonHeaders });
      }

      return Response.json(issue, { headers: jsonHeaders });
    },

    async comments({ db, params }) {
      let issueId = parseIssueId(params.issueId);

      if (issueId === undefined) {
        return Response.json({ error: "Issue not found" }, { status: 404, headers: jsonHeaders });
      }

      return Response.json(await loadComments(db, issueId), { headers: jsonHeaders });
    },
  },
});
