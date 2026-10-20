import type { MarkdownHeading } from "@withsprinkles/content-layer";
import { getCollection, getEntry, render } from "sprinkles:content";

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
}

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  publishedOn: Date;
  authorId: string;
  tags: string[];
  draft: boolean;
}

export interface Post extends PostSummary {
  Content: React.ComponentType;
  headings: MarkdownHeading[];
}

export interface PostFilter {
  tag?: string;
  authorId?: string;
}

export interface TagSummary {
  tag: string;
  count: number;
}

/**
 * A draft is never listed and never syndicated. It stays readable at its own URL while the site
 * runs in development, which is what makes a draft link worth sending to someone. `import.meta.env`
 * is inlined per environment, so in the production build that branch is gone rather than checked.
 */
const draftsReadable = import.meta.env.DEV;

export async function listPosts(filter: PostFilter = {}): Promise<PostSummary[]> {
  let entries = await getCollection("posts");
  let posts = entries.map(toSummary).filter((post) => !post.draft);

  if (filter.tag !== undefined) {
    let tag = filter.tag.toLowerCase();
    posts = posts.filter((post) => post.tags.some((value) => value.toLowerCase() === tag));
  }

  if (filter.authorId !== undefined) {
    posts = posts.filter((post) => post.authorId === filter.authorId);
  }

  return posts.sort((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime());
}

/** The drafts a writer can preview. Empty in a production build. */
export async function listDrafts(): Promise<PostSummary[]> {
  if (!draftsReadable) return [];

  let entries = await getCollection("posts");
  return entries
    .map(toSummary)
    .filter((post) => post.draft)
    .sort((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime());
}

export async function findPost(slug: string): Promise<Post | undefined> {
  let entry = await getEntry("posts", slug);
  if (!entry) return undefined;

  let summary = toSummary(entry);
  if (summary.draft && !draftsReadable) return undefined;

  let { Content, headings } = await render(entry);
  return { ...summary, Content, headings };
}

export async function listAuthors(): Promise<Author[]> {
  let entries = await getCollection("authors");
  return entries.map((entry) => entry.data).sort((a, b) => a.name.localeCompare(b.name));
}

export async function findAuthor(id: string): Promise<Author | undefined> {
  let entry = await getEntry("authors", id);
  return entry?.data;
}

export async function listTags(): Promise<TagSummary[]> {
  let counts = new Map<string, number>();

  for (let post of await listPosts()) {
    for (let tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function toSummary(entry: {
  id: string;
  data: {
    title: string;
    description: string;
    publishedOn: Date;
    author: string;
    tags: string[];
    draft?: boolean;
  };
}): PostSummary {
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    publishedOn: entry.data.publishedOn,
    authorId: entry.data.author,
    tags: entry.data.tags,
    draft: entry.data.draft ?? false,
  };
}
