import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const treksTable = pgTable("treks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  destinationId: integer("destination_id").notNull(),
  status: text("status").notNull().default("planned"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  groupSize: integer("group_size").notNull().default(1),
  guideId: integer("guide_id"),
  notes: text("notes"),
  completionRating: integer("completion_rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrekSchema = createInsertSchema(treksTable).omit({ id: true, createdAt: true });
export type InsertTrek = z.infer<typeof insertTrekSchema>;
export type Trek = typeof treksTable.$inferSelect;
