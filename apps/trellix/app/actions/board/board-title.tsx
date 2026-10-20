"use client";

import { useFrame } from "react-frame/client";

import { renameBoard } from "./actions.ts";
import { EditableText } from "./editable-text.tsx";

/** The board's own frame route, so renaming it reloads the heading and nothing else. */
export function BoardTitle({ boardId, name }: { boardId: number; name: string }) {
  let frame = useFrame();

  return (
    <h1>
      <EditableText
        action={renameBoard}
        reload={() => frame.reload()}
        fieldName="name"
        value={name}
        inputLabel="Edit board name"
        buttonLabel={`Edit board "${name}" name`}
        inputClassName="mx-8 my-4 rounded-lg border border-slate-400 px-2 py-1 text-2xl font-medium text-black"
        buttonClassName="mx-8 my-4 block rounded-lg border border-transparent px-2 py-1 text-left text-2xl font-medium text-slate-800"
      >
        <input type="hidden" name="boardId" value={boardId} />
      </EditableText>
    </h1>
  );
}
