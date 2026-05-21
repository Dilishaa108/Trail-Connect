import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guidesTable = pgTable("guides", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  experience: text("experience").notNull(),
  languages: text("languages").notNull(),
  rating: real("rating").notNull().default(4.5),
  license: text("license").notNull(),
  available: boolean("available").notNull().default(true),
  destinationId: integer("destination_id"),
  totalTreks: integer("total_treks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGuideSchema = createInsertSchema(guidesTable).omit({ id: true, createdAt: true });
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guidesTable.$inferSelect;
