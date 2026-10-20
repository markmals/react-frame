"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import type { IssueFilters } from "../../data/filters.ts";
import { issueListQuery } from "../../query/options.ts";
import { IssueRow } from "./issue-row.tsx";
import { ListToolbar } from "./list-toolbar.tsx";

/**
 * Owns the issue collection. The server component above only prefetched it, so an optimistic
 * change or a refetch here can't leave server-rendered markup disagreeing with the cache.
 */
export function IssueListView({ filters }: { filters: IssueFilters }) {
  let { data } = useSuspenseQuery(issueListQuery(filters));

  return (
    <>
      <ListToolbar filters={filters} shown={data.issues.length} total={data.total} />
      {data.issues.length === 0 ? (
        <p className="p-10 text-center text-muted">No issues match these filters.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {data.issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </ul>
      )}
    </>
  );
}
