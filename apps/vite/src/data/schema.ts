import { column as c, table } from "remix/data-table";

export const users = table({
  name: "users",
  primaryKey: "username",
  columns: {
    username: c.text(),
    passwordHash: c.text(),
  },
});
