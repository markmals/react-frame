import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { ClientFrame, type ResolveFrame, ResolveFrameContext, useFrame } from "react-frame/client";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import {
  DEFAULT_ORDER_BY,
  DEFAULT_ORDER_DIRECTION,
  type IssueFilters,
} from "../../data/filters.ts";
import type { IssueListItem, IssueListPayload } from "../../data/payloads.ts";
import { issueListQuery } from "../../query/options.ts";
import { IssueListView } from "./issue-list-view.tsx";

// The row menus post to server functions, which import `redirect` from the server build of
// react-frame; the browser build has no such export, so the module is stubbed here.
vi.mock(import("./actions.ts"), () => ({
  createIssue: vi.fn(),
  setIssueStatus: vi.fn(),
  setIssuePriority: vi.fn(),
  updateIssueContent: vi.fn(),
  addComment: vi.fn(),
  deleteIssue: vi.fn(),
}));
function filters(overrides: Partial<IssueFilters> = {}): IssueFilters {
  return {
    status: [],
    priority: [],
    query: "",
    orderBy: DEFAULT_ORDER_BY,
    orderDirection: DEFAULT_ORDER_DIRECTION,
    ...overrides,
  };
}

function issue(id: number, title: string): IssueListItem {
  return {
    id,
    title,
    status: "todo",
    priority: "medium",
    username: "Ada Okonkwo",
    created_at: Date.UTC(2026, 1, 1),
    modified_at: Date.UTC(2026, 1, 2),
  };
}

/** Dehydrates a payload the way the list frame's server component does. */
function prefetched(state: IssueFilters, payload: IssueListPayload) {
  let server = new QueryClient();
  server.setQueryData(issueListQuery(state).queryKey, payload);
  return dehydrate(server);
}

describe("IssueListView", () => {
  it("renders server-prefetched issues without fetching them again", async () => {
    let fetchSpy = vi.spyOn(globalThis, "fetch");
    let state = filters();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <HydrationBoundary
          state={prefetched(state, { issues: [issue(1, "Hydrated from the server")], total: 1 })}
        >
          <Suspense fallback={<p>Loading…</p>}>
            <IssueListView filters={state} />
          </Suspense>
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    await expect.element(page.getByText("Hydrated from the server")).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("points the Backlog filter at the main frame rather than the whole page", async () => {
    let state = filters();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <HydrationBoundary
          state={prefetched(state, { issues: [issue(1, "Only issue")], total: 1 })}
        >
          <Suspense fallback={<p>Loading…</p>}>
            <IssueListView filters={state} />
          </Suspense>
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    await page.getByText("Filter", { exact: true }).click();
    let backlog = page.getByRole("link", { name: "Backlog" });
    await expect.element(backlog).toHaveAttribute("href", "/issues?status=backlog");
    await expect.element(backlog).toHaveAttribute("data-target", "main");
    await expect.element(backlog).toHaveAttribute("data-src", "/frames/list?status=backlog");
  });

  it("keeps the old list on screen while the filtered list loads into the frame", async () => {
    let client = new QueryClient();
    let allIssues = filters();
    let backlogOnly = filters({ status: ["backlog"] });
    client.setQueryData(issueListQuery(allIssues).queryKey, {
      issues: [issue(1, "Everything issue")],
      total: 1,
    });
    client.setQueryData(issueListQuery(backlogOnly).queryKey, {
      issues: [issue(2, "Backlog issue")],
      total: 1,
    });

    let filtered = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = vi.fn<ResolveFrame>(() => filtered.promise);

    render(
      <QueryClientProvider client={client}>
        <ResolveFrameContext value={resolveFrame}>
          <ClientFrame name="main" src="/frames/list">
            <IssueListView filters={allIssues} />
            <LoadFilteredList />
          </ClientFrame>
        </ResolveFrameContext>
      </QueryClientProvider>,
    );

    await expect.element(page.getByText("Everything issue")).toBeVisible();
    await page.getByRole("button", { name: /Load the filtered list/ }).click();

    // The frame loads in a transition, so the previous rows stay put until the new ones arrive.
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    await expect.element(page.getByText("Everything issue")).toBeVisible();

    filtered.resolve(<IssueListView filters={backlogOnly} />);
    await expect.element(page.getByText("Backlog issue")).toBeVisible();
  });
});

/** Stands in for the browser runtime, which turns a `data-target` link into this frame load. */
function LoadFilteredList() {
  let frame = useFrame();
  return (
    <button type="button" onClick={() => void frame.reload()}>
      Load the filtered list{frame.pending ? " (loading)" : ""}
    </button>
  );
}
