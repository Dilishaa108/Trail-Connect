import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const destinationsTable = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  duration: text("duration").notNull(),
  difficulty: integer("difficulty").notNull(),
  maxAltitude: text("max_altitude").notNull(),
  distance: text("distance").notNull(),
  route: text("route").notNull(),
  region: text("region").notNull().default("Nepal"),
  seatsTotal: integer("seats_total").notNull().default(15),
  seatsLeft: integer("seats_left").notNull().default(15),
  bookingStatus: text("booking_status").notNull().default("Open"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  imageUrl: text("image_url"),
  hotelName: text("hotel_name"),
  hotelPhone: text("hotel_phone"),
  hospitalName: text("hospital_name"),
  emergencyPhone: text("emergency_phone"),
  itinerary: jsonb("itinerary").$type<string[]>().default([]),
  elevationPoints: jsonb("elevation_points").$type<number[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDestinationSchema = createInsertSchema(destinationsTable).omit({ id: true, createdAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;
