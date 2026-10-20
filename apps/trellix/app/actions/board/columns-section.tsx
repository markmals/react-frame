import { Frame } from "react-frame";

import { routes } from "../../routes.ts";
import { ColumnStrip } from "./column-strip.tsx";
import { columnFrameName, type BoardColumnView } from "./types.ts";

export function BoardColumnsSection({
  boardId,
  columns,
}: {
  boardId: number;
  columns: BoardColumnView[];
}) {
  return (
    <ColumnStrip boardId={boardId} startOpen={columns.length === 0}>
      {columns.map((column) => (
        <Frame
          key={column.id}
          name={columnFrameName(column.id)}
          src={routes.board.column.href({ boardId, columnId: column.id })}
        />
      ))}
    </ColumnStrip>
  );
}
