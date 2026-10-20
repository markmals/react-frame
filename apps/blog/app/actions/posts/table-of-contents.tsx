"use client";

import { useSyncExternalStore } from "react";
import type { MarkdownHeading } from "@withsprinkles/content-layer";

// How far below the top of the viewport a heading counts as the section being read.
const READING_LINE = 96;

export interface TableOfContentsProps {
  headings: MarkdownHeading[];
}

/**
 * Highlights the section the reader is in. Scroll position is an external store rather than
 * component state, so there is no effect and no copy of the DOM's truth to keep in sync.
 */
export function TableOfContents({ headings }: TableOfContentsProps) {
  let slugs = headings.map((heading) => heading.slug);
  let active = useSyncExternalStore(
    subscribeToViewport,
    () => headingAtReadingLine(slugs),
    () => slugs[0] ?? "",
  );

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="sticky top-8 self-start">
      <h2 className="text-sm font-bold tracking-wide text-muted uppercase">On this page</h2>
      <ol className="mt-3 flex list-none flex-col gap-2 p-0 text-sm">
        {headings.map((heading) => (
          <li key={heading.slug} className={heading.depth > 2 ? "pl-4" : undefined}>
            <a
              href={`#${heading.slug}`}
              aria-current={active === heading.slug ? "location" : undefined}
              className={
                active === heading.slug ? "font-bold text-accent" : "text-muted no-underline"
              }
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function subscribeToViewport(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);

  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function headingAtReadingLine(slugs: string[]): string {
  let active = slugs[0] ?? "";

  for (let slug of slugs) {
    let heading = document.getElementById(slug);
    if (heading && heading.getBoundingClientRect().top <= READING_LINE) active = slug;
  }

  return active;
}
