import type { JSONContent } from "@tiptap/react";
import { promisifyRequest } from "idb-keyval";

import { type Note, noteKey, notesStore, plainText, snippetOf } from "./notes.ts";

const seededKey = "seeded";

const minute = 60_000;

function paragraph(text: string): JSONContent {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function bullets(items: string[]): JSONContent {
  return {
    type: "bulletList",
    content: items.map((item) => ({ type: "listItem", content: [paragraph(item)] })),
  };
}

interface SeedNote {
  id: string;
  title: string;
  blocks: JSONContent[];
  pinned: boolean;
  /** How long ago the note was last touched, so the seeded order is stable. */
  ageInMinutes: number;
}

const seedNotes: SeedNote[] = [
  {
    id: "welcome",
    title: "Welcome to Notes",
    blocks: [
      paragraph(
        "Everything here lives in your browser. Notes are stored in IndexedDB, so they survive a reload and never leave the device.",
      ),
      bullets([
        "Type anywhere in a note and it saves itself a moment later.",
        "Pin the notes you come back to and they stay at the top.",
        "Search matches both titles and the text inside a note.",
      ]),
    ],
    pinned: true,
    ageInMinutes: 4,
  },
  {
    id: "formatting",
    title: "Formatting cheat sheet",
    blocks: [
      paragraph("The toolbar covers the basics, and the usual shortcuts work too."),
      bullets([
        "Bold is Cmd+B, italic is Cmd+I.",
        "Start a line with # for a heading, or - for a bullet.",
        "Three backticks open a code block.",
      ]),
      paragraph("Undo and redo are in the toolbar when your fingers forget the shortcut."),
    ],
    pinned: false,
    ageInMinutes: 90,
  },
  {
    id: "grocery-run",
    title: "Grocery run",
    blocks: [
      bullets(["Coffee beans", "Lemons", "Rye bread", "Something green"]),
      paragraph("The corner shop closes at seven on Sundays."),
    ],
    pinned: false,
    ageInMinutes: 60 * 26,
  },
];

function buildNote({ id, title, blocks, pinned, ageInMinutes }: SeedNote, now: number): Note {
  let doc: JSONContent = { type: "doc", content: blocks };
  let text = plainText(doc);
  let updatedAt = now - ageInMinutes * minute;
  return {
    id,
    title,
    doc,
    text,
    snippet: snippetOf(text),
    pinned,
    createdAt: updatedAt,
    updatedAt,
  };
}

/**
 * Writes the welcome notes the first time the app runs. The marker and the notes are written in
 * one IndexedDB transaction, so the frames that load together on a first visit can't double-seed.
 */
export function seedWelcomeNotes(): Promise<void> {
  return notesStore("readwrite", async (store) => {
    let seeded = await promisifyRequest<unknown>(store.get(seededKey));
    if (seeded !== undefined) return;

    let now = Date.now();
    store.put(now, seededKey);
    for (let note of seedNotes) store.put(buildNote(note, now), noteKey(note.id));
    await promisifyRequest(store.transaction);
  });
}
