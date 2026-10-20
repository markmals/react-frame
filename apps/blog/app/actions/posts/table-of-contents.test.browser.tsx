import { describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { TableOfContents } from "./table-of-contents.tsx";

const headings = [
  { depth: 2, slug: "alpha", text: "Alpha" },
  { depth: 2, slug: "beta", text: "Beta" },
  { depth: 3, slug: "gamma", text: "Gamma" },
];

function Article() {
  return (
    <>
      <TableOfContents headings={headings} />
      {headings.map((heading) => (
        <section key={heading.slug} style={{ height: "150vh" }}>
          <h2 id={heading.slug}>{heading.text}</h2>
        </section>
      ))}
    </>
  );
}

function scrollTo(slug: string) {
  let heading = document.getElementById(slug)!;
  // Put the heading just above the reading line the component uses.
  window.scrollTo({ top: heading.getBoundingClientRect().top + window.scrollY - 40 });
}

describe("TableOfContents", () => {
  it("highlights the section the reader has scrolled to", async () => {
    render(<Article />);

    let alpha = page.getByRole("link", { name: "Alpha" });
    let beta = page.getByRole("link", { name: "Beta" });
    let gamma = page.getByRole("link", { name: "Gamma" });

    await expect.element(alpha).toHaveAttribute("aria-current", "location");
    await expect.element(beta).not.toHaveAttribute("aria-current");

    scrollTo("beta");
    await expect.element(beta).toHaveAttribute("aria-current", "location");
    await expect.element(alpha).not.toHaveAttribute("aria-current");

    scrollTo("gamma");
    await expect.element(gamma).toHaveAttribute("aria-current", "location");
    await expect.element(beta).not.toHaveAttribute("aria-current");

    window.scrollTo({ top: 0 });
    await expect.element(alpha).toHaveAttribute("aria-current", "location");
  });

  it("links each entry to its heading and indents the deeper ones", async () => {
    render(<Article />);

    await expect
      .element(page.getByRole("link", { name: "Gamma" }))
      .toHaveAttribute("href", "#gamma");
    expect(page.getByRole("link", { name: "Gamma" }).element().parentElement!.className).toContain(
      "pl-4",
    );
    expect(page.getByRole("link", { name: "Beta" }).element().parentElement!.className).toBe("");
  });

  it("renders nothing for a post without headings", async () => {
    render(<TableOfContents headings={[]} />);

    await expect.element(page.getByRole("navigation")).not.toBeInTheDocument();
  });
});
