import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }).notNull(),
  additionalInfo: text("additional_info"),
  completedStepIds: text("completed_step_ids")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type ReleaseRow = typeof releases.$inferSelect;
export type NewReleaseRow = typeof releases.$inferInsert;
