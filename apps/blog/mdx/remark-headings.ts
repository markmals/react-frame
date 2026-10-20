/**
 * Gives every MDX heading a stable `id` and adds `export const headings` to the compiled module,
 * which is what content-layer's `render()` hands back as `headings`. Nothing else in the content
 * pipeline produces that export, so without this plugin a post's table of contents is empty.
 */

interface MarkdownNode {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown>; estree?: unknown };
}

interface PostHeading {
  depth: number;
  slug: string;
  text: string;
}

export function remarkHeadings() {
  return (tree: MarkdownNode) => {
    let headings: PostHeading[] = [];
    let used = new Map<string, number>();

    collectHeadings(tree, (node) => {
      let text = textContent(node);
      let slug = slugify(text, used);

      node.data ??= {};
      node.data.hProperties = { ...node.data.hProperties, id: slug };
      headings.push({ depth: node.depth!, slug, text });
    });

    tree.children ??= [];
    tree.children.push(headingsExport(headings));
  };
}

function collectHeadings(node: MarkdownNode, visit: (heading: MarkdownNode) => void) {
  if (node.type === "heading" && typeof node.depth === "number") {
    visit(node);
    return;
  }

  for (let child of node.children ?? []) {
    collectHeadings(child, visit);
  }
}

function textContent(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(textContent).join("");
}

// Mirrors GitHub's heading anchors: lowercase, punctuation dropped, spaces hyphenated, with a
// counter appended when a post repeats a heading.
function slugify(text: string, used: Map<string, number>): string {
  let slug =
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";

  let seen = used.get(slug) ?? 0;
  used.set(slug, seen + 1);
  return seen === 0 ? slug : `${slug}-${seen}`;
}

// MDX turns `mdxjsEsm` nodes into top-level module code from their estree, not their text, so the
// export has to be spelled out as an AST.
function headingsExport(headings: PostHeading[]) {
  return {
    type: "mdxjsEsm",
    value: `export const headings = ${JSON.stringify(headings)};`,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        comments: [],
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            source: null,
            attributes: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { type: "Identifier", name: "headings" },
                  init: {
                    type: "ArrayExpression",
                    elements: headings.map((heading) => ({
                      type: "ObjectExpression",
                      properties: Object.entries(heading).map(([key, value]) => ({
                        type: "Property",
                        kind: "init",
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: { type: "Identifier", name: key },
                        value: { type: "Literal", value },
                      })),
                    })),
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };
}
