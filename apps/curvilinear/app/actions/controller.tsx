import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { WORKSPACE_NAME } from "../data/workspace.ts";
import { routes } from "../routes.ts";
import { issueKey } from "../utils/format.ts";
import { parseIssueId } from "../utils/ids.ts";
import { Shell } from "./shell.tsx";

// The shell embeds frames that reflect the database, so it is never cacheable.
const documentHeaders = { "Cache-Control": "no-store" };

export default createController(routes, {
  actions: {
    home() {
      return redirect(routes.issues.href(), 303);
    },

    issues({ render, url }) {
      // The raw search goes through so the frame sees `new` and `error` as well as the filters.
      return render(
        <Shell
          mainSrc={routes.frames.list.href() + url.search}
          title={`Issues · ${WORKSPACE_NAME}`}
        />,
        { headers: documentHeaders },
      );
    },

    issue({ params, render, url }) {
      let issueId = parseIssueId(params.issueId);
      let title =
        issueId === undefined
          ? `Issue · ${WORKSPACE_NAME}`
          : `${issueKey(issueId)} · ${WORKSPACE_NAME}`;

      return render(
        <Shell
          mainSrc={routes.frames.issue.href({ issueId: params.issueId }) + url.search}
          title={title}
        />,
        { headers: documentHeaders },
      );
    },
  },
});
