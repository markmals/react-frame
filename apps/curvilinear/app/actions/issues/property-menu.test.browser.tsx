import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  type Priority,
  type Status,
} from "../../data/issue-fields.ts";
import { PriorityIcon, StatusIcon } from "../../ui/icons.tsx";
import { PropertyMenu } from "./property-menu.tsx";

function renderStatusMenu(submit: (formData: FormData) => Promise<void>) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PropertyMenu<Status>
        field="status"
        issueId={7}
        value="todo"
        options={STATUSES}
        labels={STATUS_LABELS}
        renderIcon={(status) => <StatusIcon status={status} />}
        submit={submit}
        menuLabel="Status"
        showValue
      />
    </QueryClientProvider>,
  );
}

describe("PropertyMenu", () => {
  it("shows the chosen status while the server function is still running", async () => {
    let call = Promise.withResolvers<void>();
    let submit = vi.fn((_formData: FormData) => call.promise);

    renderStatusMenu(submit);
    await page.getByText("Status: To Do", { exact: true }).click();
    await page.getByRole("button", { name: "Done" }).click();

    // The optimistic value is on screen before the mutation resolves.
    await expect.element(page.getByText("Status: Done", { exact: true })).toBeVisible();
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]![0].get("status")).toBe("done");
    expect(submit.mock.calls[0]![0].get("issueId")).toBe("7");

    call.resolve();
    await expect.element(page.getByText("Status: Done", { exact: true })).toBeVisible();
  });

  it("rolls back to the server's value when the server function fails", async () => {
    let call = Promise.withResolvers<void>();
    let submit = vi.fn((_formData: FormData) => call.promise);

    renderStatusMenu(submit);
    await page.getByText("Status: To Do", { exact: true }).click();
    await page.getByRole("button", { name: "Canceled" }).click();
    await expect.element(page.getByText("Status: Canceled", { exact: true })).toBeVisible();

    call.reject(new Error("Server function blew up"));

    await expect.element(page.getByRole("alert")).toHaveTextContent("Server function blew up");
    await expect.element(page.getByText("Status: To Do", { exact: true })).toBeVisible();
  });

  it("submits the priority the clicked option carries", async () => {
    let call = Promise.withResolvers<void>();
    let submit = vi.fn((_formData: FormData) => call.promise);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PropertyMenu<Priority>
          field="priority"
          issueId={12}
          value="none"
          options={PRIORITIES}
          labels={PRIORITY_LABELS}
          renderIcon={(priority) => <PriorityIcon priority={priority} />}
          submit={submit}
          menuLabel="Priority"
          showValue
        />
      </QueryClientProvider>,
    );

    await page.getByText("Priority: No priority", { exact: true }).click();
    await page.getByRole("button", { name: "Urgent" }).click();

    await expect.element(page.getByText("Priority: Urgent", { exact: true })).toBeVisible();
    expect(submit.mock.calls[0]![0].get("priority")).toBe("urgent");

    call.resolve();
  });
});
