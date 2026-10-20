import { listAuthors, listPosts } from "../content.ts";
import { routes } from "../routes.ts";

const TITLE = "Marginalia";
const DESCRIPTION =
  "Notes on building for the web: rendering, routing, forms, and the operational details in between.";

/** RSS 2.0 for every published post. Drafts are excluded from `listPosts()` in every environment. */
export async function renderFeed(origin: string): Promise<string> {
  let [posts, authors] = await Promise.all([listPosts(), listAuthors()]);
  let updated = posts[0]?.publishedOn ?? new Date(0);

  let items = posts.map((post) => {
    let link = `${origin}${routes.posts.show.href({ slug: post.slug })}`;
    let author = authors.find((it) => it.id === post.authorId);
    let categories = post.tags.map((tag) => `    <category>${escapeXml(tag)}</category>`);

    return [
      "  <item>",
      `    <title>${escapeXml(post.title)}</title>`,
      `    <link>${escapeXml(link)}</link>`,
      `    <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `    <pubDate>${post.publishedOn.toUTCString()}</pubDate>`,
      `    <description>${escapeXml(post.description)}</description>`,
      ...(author === undefined ? [] : [`    <dc:creator>${escapeXml(author.name)}</dc:creator>`]),
      ...categories,
      "  </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    `  <title>${TITLE}</title>`,
    `  <link>${escapeXml(`${origin}/`)}</link>`,
    `  <description>${escapeXml(DESCRIPTION)}</description>`,
    "  <language>en-us</language>",
    `  <lastBuildDate>${updated.toUTCString()}</lastBuildDate>`,
    `  <atom:link href="${escapeXml(`${origin}${routes.feed.href()}`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
