import {
  DEFAULT_ORDER_BY,
  DEFAULT_ORDER_DIRECTION,
  type IssueFilters,
} from "../../data/filters.ts";
import type { Status } from "../../data/issue-fields.ts";
import type { ViewCounts } from "../../data/issue-queries.ts";
import { CURRENT_USER, WORKSPACE_NAME } from "../../data/workspace.ts";
import { Avatar } from "../../ui/avatar.tsx";
import { PlusIcon, StatusIcon } from "../../ui/icons.tsx";
import { listFrameHref, listHref, withParam } from "../issues/links.ts";

interface SavedView {
  label: string;
  statuses: Status[];
  /** The status icon that stands for the view, or `null` for the all-issues entry. */
  icon: Status | null;
}

const SAVED_VIEWS: SavedView[] = [
  { label: "All issues", statuses: [], icon: null },
  { label: "Active", statuses: ["todo", "in_progress"], icon: "in_progress" },
  { label: "Backlog", statuses: ["backlog"], icon: "backlog" },
  { label: "Done", statuses: ["done"], icon: "done" },
  { label: "Canceled", statuses: ["canceled"], icon: "canceled" },
];

function filtersFor(view: SavedView): IssueFilters {
  return {
    status: view.statuses,
    priority: [],
    query: "",
    orderBy: DEFAULT_ORDER_BY,
    orderDirection: DEFAULT_ORDER_DIRECTION,
  };
}

const NO_FILTERS = filtersFor(SAVED_VIEWS[0]!);

/**
 * Server-owned: the view counts come straight from the database, and every mutation reloads this
 * frame rather than teaching the client cache about aggregates it never renders.
 */
export function MenuFrame({ counts }: { counts: ViewCounts }) {
  return (
    <nav
      aria-label="Views"
      className="flex w-sidebar shrink-0 flex-col border-r border-line bg-sidebar"
    >
      <div className="flex h-topbar items-center gap-2 px-4">
        <span className="font-semibold">{WORKSPACE_NAME}</span>
        <span className="ml-auto">
          <Avatar name={CURRENT_USER} />
        </span>
      </div>

      <div className="px-3">
        <a
          href={withParam(listHref(NO_FILTERS), "new=1")}
          data-target="main"
          data-src={withParam(listFrameHref(NO_FILTERS), "new=1")}
          className="flex h-7 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-canvas font-medium hover:bg-hover"
        >
          <PlusIcon />
          New issue
        </a>
      </div>

      <ul className="mt-5 flex flex-col px-2">
        {SAVED_VIEWS.map((view) => {
          let filters = filtersFor(view);
          return (
            <li key={view.label}>
              <a
                href={listHref(filters)}
                data-target="main"
                data-src={listFrameHref(filters)}
                className="flex h-7 items-center gap-2 rounded-control px-2 text-muted hover:bg-hover hover:text-ink"
              >
                {view.icon === null ? (
                  <span aria-hidden="true" className="size-3.5 rounded-xs border border-faint" />
                ) : (
                  <StatusIcon status={view.icon} />
                )}
                <span className="flex-1">{view.label}</span>
                <span className="text-faint tabular-nums">{countFor(view, counts)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function countFor(view: SavedView, counts: ViewCounts): number {
  if (view.statuses.length === 0) return counts.total;
  return view.statuses.reduce((sum, status) => sum + counts.byStatus[status], 0);
}
