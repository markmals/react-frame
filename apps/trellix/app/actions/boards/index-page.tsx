import { Frame } from "react-frame";

import { routes } from "../../routes.ts";
import { PrimaryButton } from "../../ui/buttons.tsx";
import { Layout } from "../../ui/layout.tsx";
import { createBoard } from "./actions.ts";

export function BoardsIndexPage() {
  return (
    <Layout title="Boards">
      <div className="h-full">
        <form action={createBoard} className="max-w-md p-8">
          <h2 className="mb-2 text-xl font-bold">New Board</h2>

          <label htmlFor="board-name" className="block text-sm leading-6 font-medium text-gray-900">
            Name
          </label>
          <div className="mt-2">
            <input
              id="board-name"
              name="name"
              type="text"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-brand-blue focus:ring-inset sm:text-sm"
            />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <label
                htmlFor="board-color"
                className="block text-sm leading-6 font-medium text-gray-900"
              >
                Color
              </label>
              <input
                id="board-color"
                name="color"
                type="color"
                defaultValue="#cbd5e1"
                className="bg-transparent"
              />
            </div>
            <PrimaryButton pendingLabel="Creating...">Create</PrimaryButton>
          </div>
        </form>

        <div className="p-8">
          <h2 className="mb-2 text-xl font-bold">Boards</h2>
          <Frame name="board-list" src={routes.boards.list.href()} />
        </div>
      </div>
    </Layout>
  );
}
