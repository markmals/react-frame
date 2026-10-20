import { describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../test/render.tsx";
import { Poll } from "./poll.tsx";

const options = ["This month", "This year, I think", "Never"];

describe("Poll", () => {
  it("records a choice and lets the reader change it", async () => {
    render(<Poll question="When did you last try it?" options={options} />);

    let status = page.getByRole("status");
    await expect.element(status).toHaveTextContent("Pick one. Nothing is sent anywhere.");

    await page.getByRole("radio", { name: "Never" }).click();
    await expect
      .element(status)
      .toHaveTextContent("You picked “Never”. It stays in this page and goes nowhere else.");
    await expect.element(page.getByRole("radio", { name: "Never" })).toBeChecked();

    await page.getByRole("radio", { name: "This month" }).click();
    await expect
      .element(status)
      .toHaveTextContent("You picked “This month”. It stays in this page and goes nowhere else.");
    await expect.element(page.getByRole("radio", { name: "Never" })).not.toBeChecked();
  });

  it("keeps two polls on one page independent", async () => {
    render(
      <>
        <Poll question="First question" options={options} />
        <Poll question="Second question" options={options} />
      </>,
    );

    let radios = page.getByRole("radio", { name: "Never" });
    await radios.nth(0).click();

    let statuses = page.getByRole("status");
    await expect
      .element(statuses.nth(0))
      .toHaveTextContent("You picked “Never”. It stays in this page and goes nowhere else.");
    await expect.element(statuses.nth(1)).toHaveTextContent("Pick one. Nothing is sent anywhere.");
  });
});
