import type { JSONContent } from "@tiptap/react";
import { createStore, del, entries, get, set } from "idb-keyval";

export interface Note {
  id: string;
  title: string;
  /** The editor's document, kept as TipTap JSON so the editor loads it unchanged. */
  doc: JSONContent;
  /** The document's plain text. Search matches against it, so it holds the whole body. */
  text: string;
  /** The opening of `text`, for the sidebar. */
  snippet: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/** One IndexedDB database for the app, holding notes alongside the seeding marker. */
export const notesStore = createStore("react-frame-notes", "notes");

const notePrefix = "note:";

export function noteKey(id: string) {
  return notePrefix + id;
}

export const emptyDocument: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const snippetLength = 160;

function inlineText(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(inlineText).join("");
}

/** Flattens a TipTap document to one line per text block, so snippets and search read naturally. */
export function plainText(doc: JSONContent): string {
  let lines: string[] = [];
  let collect = (node: JSONContent) => {
    let children = node.content ?? [];
    if (children.some((child) => typeof child.text === "string")) {
      lines.push(children.map(inlineText).join(""));
      return;
    }
    for (let child of children) collect(child);
  };
  collect(doc);
  return lines.join("\n");
}

export function snippetOf(text: string) {
  let collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > snippetLength ? `${collapsed.slice(0, snippetLength)}…` : collapsed;
}

/** Pinned notes first, then the most recently updated. */
function byPinnedThenRecent(left: Note, right: Note) {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
  return right.updatedAt - left.updatedAt;
}

export async function listNotes(query = ""): Promise<Note[]> {
  let stored = await entries<string, Note>(notesStore);
  let notes = stored
    .filter(([key]) => key.startsWith(notePrefix))
    .map(([, note]) => note)
    .sort(byPinnedThenRecent);

  let needle = query.trim().toLowerCase();
  if (needle === "") return notes;
  return notes.filter(
    (note) => note.title.toLowerCase().includes(needle) || note.text.toLowerCase().includes(needle),
  );
}

export async function getNote(id: string): Promise<Note | undefined> {
  return get<Note>(noteKey(id), notesStore);
}

/** A form field as text. `FormData` entries can also be files, which these forms never post. */
function textField(formData: FormData, name: string) {
  let value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createNote(formData: FormData): Promise<Note> {
  let now = Date.now();
  let note: Note = {
    id: crypto.randomUUID(),
    title: textField(formData, "title"),
    doc: emptyDocument,
    text: "",
    snippet: "",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  await set(noteKey(note.id), note, notesStore);
  return note;
}

export async function updateNote(formData: FormData): Promise<void> {
  let id = textField(formData, "noteId");
  let note = await getNote(id);
  // An autosave can land after the note was deleted; there is nothing left to write to.
  if (!note) return;

  let doc = JSON.parse(textField(formData, "doc")) as JSONContent;
  let text = plainText(doc);
  let updated: Note = {
    ...note,
    title: textField(formData, "title"),
    doc,
    text,
    snippet: snippetOf(text),
    updatedAt: Date.now(),
  };
  await set(noteKey(id), updated, notesStore);
}

export async function setNotePinned(formData: FormData): Promise<void> {
  let id = textField(formData, "noteId");
  let note = await getNote(id);
  if (!note) return;

  await set(noteKey(id), { ...note, pinned: formData.get("pinned") === "true" }, notesStore);
}

export async function deleteNote(formData: FormData): Promise<void> {
  await del(noteKey(textField(formData, "noteId")), notesStore);
}
