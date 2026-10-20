import { column as c, hasMany, table } from "remix/data-table";
import type { TableRow } from "remix/data-table";

export const Accounts = table({
  name: "accounts",
  columns: {
    id: c.text(),
    email: c.text(),
    created_at: c.integer(),
  },
  beforeWrite({ operation, value }) {
    let next = { ...value };

    if (typeof next.email === "string") {
      next.email = normalizeEmail(next.email);
    }

    if (operation === "create" && next.created_at === undefined) {
      next.created_at = Date.now();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let issues: Array<{ message: string; path?: Array<string | number> }> = [];
    let email = typeof value.email === "string" ? normalizeEmail(value.email) : undefined;

    if (operation === "create" && !email) {
      issues.push({ message: "Email is required.", path: ["email"] });
    }

    if (email !== undefined && !isValidEmail(email)) {
      issues.push({ message: "Email address is invalid.", path: ["email"] });
    }

    return issues.length > 0 ? { issues } : { value };
  },
  afterRead({ value }) {
    if (typeof value.email !== "string") {
      return { value };
    }

    let email = normalizeEmail(value.email);
    return email === value.email ? { value } : { value: { ...value, email } };
  },
});

export const Passwords = table({
  name: "passwords",
  primaryKey: ["account_id"],
  columns: {
    account_id: c.text(),
    hash: c.text(),
  },
});

export const Boards = table({
  name: "boards",
  columns: {
    id: c.integer(),
    name: c.text(),
    color: c.text(),
    created_at: c.integer(),
    account_id: c.text(),
  },
  beforeWrite({ operation, value }) {
    let next = { ...value };

    if (typeof next.name === "string") {
      next.name = next.name.trim();
    }

    if (operation === "create" && next.created_at === undefined) {
      next.created_at = Date.now();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let issues: Array<{ message: string; path?: Array<string | number> }> = [];
    let name = typeof value.name === "string" ? value.name.trim() : undefined;

    if (operation === "create" && !name) {
      issues.push({ message: "Board name is required.", path: ["name"] });
    }

    if (name !== undefined && name.length === 0) {
      issues.push({ message: "Board name is required.", path: ["name"] });
    }

    if (typeof value.color === "string" && !isHexColor(value.color)) {
      issues.push({ message: "Board color must be a hex color.", path: ["color"] });
    }

    return issues.length > 0 ? { issues } : { value };
  },
});

// `sort_order` is Trellix's fractional `order`: dropping a card between 1.0 and 2.0 stores 1.5.
export const Columns = table({
  name: "columns",
  columns: {
    id: c.text(),
    name: c.text(),
    sort_order: c.decimal(16, 8),
    board_id: c.integer(),
  },
  beforeWrite({ value }) {
    let next = { ...value };

    if (typeof next.name === "string") {
      next.name = next.name.trim();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let name = typeof value.name === "string" ? value.name.trim() : undefined;

    if ((operation === "create" && !name) || name?.length === 0) {
      return { issues: [{ message: "Column name is required.", path: ["name"] }] };
    }

    return { value };
  },
});

export const Items = table({
  name: "items",
  columns: {
    id: c.text(),
    title: c.text(),
    content: c.text().nullable(),
    sort_order: c.decimal(16, 8),
    column_id: c.text(),
    board_id: c.integer(),
  },
  beforeWrite({ value }) {
    let next = { ...value };

    if (typeof next.title === "string") {
      next.title = next.title.trim();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let title = typeof value.title === "string" ? value.title.trim() : undefined;

    if ((operation === "create" && !title) || title?.length === 0) {
      return { issues: [{ message: "Card title is required.", path: ["title"] }] };
    }

    return { value };
  },
});

export const columnsByBoard = hasMany(Boards, Columns);
export const itemsByBoard = hasMany(Boards, Items);

export type Account = TableRow<typeof Accounts>;
export type Board = TableRow<typeof Boards>;
export type BoardColumn = TableRow<typeof Columns>;
export type Item = TableRow<typeof Items>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
