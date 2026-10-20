# Notes

A local-first note-taking app: no server, no accounts, no network. It runs entirely in the browser on `react-frame/spa`, the same runtime [`apps/spa`](../spa) uses, stores notes in IndexedDB through [`idb-keyval`](https://github.com/jakearchibald/idb-keyval), and edits them with [TipTap](https://tiptap.dev) v3.

It is the single-page holotype: where the bookstore renders React Server Components on a server, this app ships the router to the browser and keeps everything else — routes, controllers, pages, frames, `<form>` submissions — exactly the same shape a server app would use.

## How it's organized

`app/main.tsx` starts the runtime with `run(router, …)`, `app/router.tsx` builds the router and maps the controllers, and `app/routes.ts` is the URL contract.

Controllers live beside the pages they render, as in the bookstore: `app/actions/controller.tsx` (the home page and note creation), `app/actions/notes/controller.tsx` (a note's page and deletion), and `app/actions/frames/controller.tsx` (the two frame routes).

`app/data/notes.ts` is the whole data layer: the `Note` shape, the IndexedDB store, and async functions that take `FormData` the way server functions do. `app/data/seed.ts` writes the welcome notes the first time the app runs.

Shared UI is in `app/ui/`: the loading indicator, the new-note button, the search form, a relative-time formatter, and the two hooks that read the address bar.

## Routes and frames

| Route           | Pattern                      | What it is                             |
| --------------- | ---------------------------- | -------------------------------------- |
| `home`          | `GET /`                      | The app with no note open              |
| `createNote`    | `POST /`                     | Creates a note, redirects to it        |
| `notes.show`    | `GET /notes/:noteId`         | The app with a note open               |
| `notes.destroy` | `POST /notes/:noteId`        | Deletes it, redirects to the next note |
| `frames.list`   | `GET /frames/notes?q=`       | The sidebar list                       |
| `frames.blank`  | `GET /frames/editor`         | The "no note selected" pane            |
| `frames.editor` | `GET /frames/editor/:noteId` | The editor for one note                |

A page is a two-column layout whose columns are both frames: `<Frame name="note-list">` for the sidebar and `<Frame name="note">` for the editor. Each is a route of its own, which is what makes the two halves independent.

Opening a note is a link with `data-target="note"` and `data-src` pointing at the editor route, so the address bar moves to `/notes/:noteId` while only the editor frame loads. The list, the search box, and the scroll position stay exactly as they were.

Searching is a `GET` form with the same treatment: it navigates to `?q=…` on the current page, so the query is in the URL and survives a reload or a share, but `data-target="note-list"` means only the sidebar loads. The open note is untouched.

Every `POST` pattern is also a `GET` page. A URL that only answers `POST` would send the router's built-in 405 back to the browser runtime, which has no way to render it.

## Mutations and reloads

Mutations that change which note the browser should be on — create and delete — are plain `<form method="POST">` submissions that the router handles and answers with a `303`. The runtime follows the redirect, the page renders at the new URL, and both frames load with it.

Mutations that only change what a frame shows are React form actions: pinning calls `setNotePinned(formData)` and then `useFrame().reload()`, which reloads just the sidebar. `useFormStatus()` keeps the button pending until the new list is on screen.

Autosave is the interesting one. Typing in the title or the body schedules a save in a transition that first waits out a 400 ms debounce, then writes the note and reloads the sidebar frame so its title, snippet, and ordering catch up. Because the whole wait lives inside one transition, the "Saving…"/"Saved" indicator is just `isPending` — there is no state tracking it — and the sidebar reload never reaches the editor, so TipTap keeps its instance, its undo history, and the caret. `app/notes.test.browser.tsx` asserts that the editor's DOM node is the same object after a save.

## Run it

```sh
pnpm -C apps/notes dev
```

Then open [http://localhost:44700](http://localhost:44700). The first run seeds three welcome notes; after that the app leaves the store alone. To start over, delete the `react-frame-notes` database in the browser's devtools.

## Test it

```sh
pnpm exec playwright install chromium
pnpm -C apps/notes test
```

The tests run the app in Chromium with Vitest Browser Mode. Each one clears the IndexedDB store first, so every test starts from the seeded welcome notes, then drives the real UI: creating and autosaving a note and reading it back after a restart, searching, pinning, deleting, the not-found pane, the toolbar's active state, and the sidebar reloading mid-save without remounting the editor.

## Build it

```sh
pnpm -C apps/notes build
pnpm -C apps/notes preview
```

`build` type-checks and emits a static bundle into `dist/`; `preview` serves it on the same port with the history fallback deep links need.
