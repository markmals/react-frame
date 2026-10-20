"use client";

import { useState } from "react";

import type { IssueFilters } from "../../data/filters.ts";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../data/issue-fields.ts";
import { routes } from "../../routes.ts";
import { CloseIcon, SearchIcon } from "../../ui/icons.tsx";
import { FilterDropdown, OrderDropdown } from "./filter-menu.tsx";
import { listFrameHref, listHref } from "./links.ts";

/** The saved views the left menu links to, recognised by their exact status set. */
const VIEW_TITLES: Record<string, string> = {
  "": "All issues",
  backlog: "Backlog",
  "in_progress,todo": "Active",
  done: "Done",
  canceled: "Canceled",
};

export function viewTitle(filters: IssueFilters): string {
  return VIEW_TITLES[[...filters.status].sort().join(",")] ?? "Filtered issues";
}

export function ListToolbar({
  filters,
  shown,
  total,
}: {
  filters: IssueFilters;
  shown: number;
  total: number;
}) {
  let [query, setQuery] = useState(filters.query);
  let hasChips = filters.status.length > 0 || filters.priority.length > 0;

  return (
    <>
      <div className="flex h-topbar shrink-0 items-center gap-3 border-b border-line px-5">
        <h1 className="font-semibold">{viewTitle(filters)}</h1>
        <span className="text-muted tabular-nums">
          {shown}
          {shown === total ? "" : ` of ${total}`}
        </span>
        <FilterDropdown filters={filters} />
        <form
          method="get"
          action={routes.issues.href()}
          data-target="main"
          // Recomputed as the field changes, because `data-src` has to name the frame URL the
          // submission will produce, and a GET form's destination comes from its own fields.
          data-src={listFrameHref({ ...filters, query: query.trim() })}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-control border border-line px-2 focus-within:border-brand"
        >
          {filters.status.length > 0 ? (
            <input type="hidden" name="status" value={filters.status.join(",")} />
          ) : null}
          {filters.priority.length > 0 ? (
            <input type="hidden" name="priority" value={filters.priority.join(",")} />
          ) : null}
          <input type="hidden" name="orderBy" value={filters.orderBy} />
          <input type="hidden" name="orderDirection" value={filters.orderDirection} />
          <SearchIcon />
          <label htmlFor="issue-search" className="sr-only">
            Search issues by title
          </label>
          <input
            id="issue-search"
            name="query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search issues"
            className="w-44 bg-transparent outline-none placeholder:text-faint"
          />
        </form>
        <OrderDropdown filters={filters} />
      </div>

      {hasChips ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-line px-5 py-2">
          {filters.priority.length > 0 ? (
            <FilterChip
              label="Priority is"
              values={filters.priority.map((priority) => PRIORITY_LABELS[priority])}
              cleared={{ ...filters, priority: [] }}
            />
          ) : null}
          {filters.status.length > 0 ? (
            <FilterChip
              label="Status is"
              values={filters.status.map((status) => STATUS_LABELS[status])}
              cleared={{ ...filters, status: [] }}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function FilterChip({
  label,
  values,
  cleared,
}: {
  label: string;
  values: string[];
  cleared: IssueFilters;
}) {
  return (
    <span className="flex items-center overflow-hidden rounded-control border border-line text-muted">
      <span className="px-2 py-0.5">{label}</span>
      <span className="border-l border-line px-2 py-0.5 text-ink">{values.join(", ")}</span>
      <a
        href={listHref(cleared)}
        data-target="main"
        data-src={listFrameHref(cleared)}
        aria-label={`Clear filter: ${label} ${values.join(", ")}`}
        className="flex h-full items-center border-l border-line px-1.5 hover:bg-hover"
      >
        <CloseIcon />
      </a>
    </span>
  );
}
