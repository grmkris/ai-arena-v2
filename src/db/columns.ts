import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";
import { typeid } from "typeid-js";

/** Auto-managed createdAt / updatedAt timestamps (millisecond precision) */
export const baseEntityFields = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
};

/** TypeID primary key column — auto-generates an ID with the given prefix */
export function typeIdPrimaryKey(prefix: string) {
  return text("id")
    .primaryKey()
    .$defaultFn(() => typeid(prefix).toString());
}
