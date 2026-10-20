import { type Editor, useEditorState } from "@tiptap/react";

/** Reads the marks and nodes under the cursor, so every button shows whether it is on. */
export function EditorToolbar({ editor }: { editor: Editor }) {
  let state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  return (
    <div
      role="group"
      aria-label="Formatting"
      className="mt-4 flex flex-wrap gap-1 border-y border-line py-2"
    >
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Strike"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="Code"
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        label="H1"
        active={state.heading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="H2"
        active={state.heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Bullets"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbers"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Quote"
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Code block"
        active={state.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

function ToolbarButton({ active, disabled, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-transparent px-2 py-1 text-sm font-bold text-body hover:border-line aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent disabled:cursor-default disabled:opacity-40"
    >
      {label}
    </button>
  );
}
