import { findInFiles, Lang, type NapiConfig } from "@ast-grep/napi";

const useClientDirective: NapiConfig = {
  rule: {
    all: [
      { kind: "expression_statement" },
      { has: { kind: "string", regex: `^['"]use client['"]$` } },
      { inside: { kind: "program", stopBy: "neighbor" } },
    ],
  },
};

/** Finds modules under `root` that start with a "use client" directive, skipping gitignored paths. */
export async function findClientModules(root: string) {
  const files = await Promise.all(
    [Lang.Tsx, Lang.TypeScript, Lang.JavaScript].map((lang) => findInLanguage(lang, root)),
  );
  return files.flat();
}

async function findInLanguage(lang: Lang, root: string) {
  const files: string[] = [];
  let firstError: Error | undefined;
  let callbackCount = 0;
  let expectedCallbacks: number | undefined;
  let onAllCallbacks = () => {};
  const allCallbacks = new Promise<void>((resolve) => (onAllCallbacks = resolve));

  const matchedFileCount = await findInFiles(
    lang,
    { paths: [root], matcher: useClientDirective },
    (error, nodes) => {
      if (error) firstError ??= error;
      else files.push(nodes[0].getRoot().filename());
      if (++callbackCount === expectedCallbacks) onAllCallbacks();
    },
  );

  // findInFiles can resolve before every per-file callback has run (ast-grep/ast-grep#206).
  expectedCallbacks = matchedFileCount;
  if (callbackCount < matchedFileCount) await allCallbacks;
  if (firstError) throw firstError;
  return files;
}
