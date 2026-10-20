import { column as c, table } from "remix/data-table";

export const Users = table({
  name: "users",
  primaryKey: "username",
  columns: {
    username: c.text(),
    passwordHash: c.text(),
  },
});
