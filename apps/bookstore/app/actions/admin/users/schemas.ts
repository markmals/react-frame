import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";

const TextField = f.field(s.defaulted(s.string(), ""));
const RoleField = f.field(
  s.defaulted(s.union([s.literal("customer"), s.literal("admin")]), "customer"),
);

export const UserSchema = f.object({
  name: TextField,
  email: TextField,
  role: RoleField,
});
