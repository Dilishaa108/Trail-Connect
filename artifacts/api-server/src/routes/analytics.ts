import { Router } from "express";
import { db, treksTable, usersTable, destinationsTable, guidesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [treksCount] = await db.select({ count: sql<number>`count(*)::int` }).from(treksTable);
  const [activeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(treksTable)
    .where(eq(treksTable.status, "planned"));
  const [destCount] = await db.select({ count: sql<number>`count(*)::int` }).from(destinationsTable);
  const [completedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(treksTable)
    .where(eq(treksTable.status, "completed"));
  const [guidesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(guidesTable);

  res.json({
    totalUsers: usersCount?.count ?? 0,
    totalTreks: treksCount?.count ?? 0,
    activeBookings: activeCount?.count ?? 0,
    totalDestinations: destCount?.count ?? 0,
    completedTreks: completedCount?.count ?? 0,
    totalGuides: guidesCount?.count ?? 0,
  });
});

router.get("/popular-routes", async (req, res) => {
  const treks = await db.select({ destinationId: treksTable.destinationId }).from(treksTable);
  const counts: Record<number, number> = {};
  for (const t of treks) {
    counts[t.destinationId] = (counts[t.destinationId] ?? 0) + 1;
  }

  const destinations = await db.select({
    id: destinationsTable.id,
    name: destinationsTable.name,
    difficulty: destinationsTable.difficulty,
  }).from(destinationsTable);

  const result = destinations.map(d => ({
    destinationId: d.id,
    destinationName: d.name,
    bookingCount: counts[d.id] ?? 0,
    difficulty: d.difficulty,
  })).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 8);

  res.json(result);
});

router.get("/monthly-bookings", async (req, res) => {
  const treks = await db.select({ createdAt: treksTable.createdAt }).from(treksTable);

  const monthly: Record<string, number> = {};
  for (const trek of treks) {
    const d = new Date(trek.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = (monthly[key] ?? 0) + 1;
  }

  // Fill last 12 months
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    result.push({ month: monthLabel, count: monthly[key] ?? 0 });
  }

  res.json(result);
});

router.get("/difficulty-breakdown", async (req, res) => {
  const destinations = await db.select({ difficulty: destinationsTable.difficulty }).from(destinationsTable);
  const treks = await db.select({ destinationId: treksTable.destinationId }).from(treksTable);

  const destDifficulty: Record<number, number> = {};
  const destIds = await db.select({ id: destinationsTable.id, difficulty: destinationsTable.difficulty }).from(destinationsTable);
  for (const d of destIds) destDifficulty[d.id] = d.difficulty;

  let easy = 0, moderate = 0, hard = 0;
  for (const t of treks) {
    const diff = destDifficulty[t.destinationId] ?? 0;
    if (diff <= 50) easy++;
    else if (diff <= 75) moderate++;
    else hard++;
  }

  res.json([
    { level: "Easy", count: easy },
    { level: "Moderate", count: moderate },
    { level: "Hard", count: hard },
  ]);
});

export default router;
