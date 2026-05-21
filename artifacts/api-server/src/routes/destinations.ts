import { Router } from "express";
import { db, destinationsTable } from "@workspace/db";
import { eq, ilike, lte, gte } from "drizzle-orm";
import { ListDestinationsQueryParams, CreateDestinationBody, UpdateDestinationBody, GetDestinationParams, DeleteDestinationParams, UpdateDestinationParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const queryParse = ListDestinationsQueryParams.safeParse(req.query);
  const { difficulty, duration, region } = queryParse.success ? queryParse.data : {};

  let query = db.select().from(destinationsTable).$dynamic();
  const conditions = [];
  if (region) conditions.push(ilike(destinationsTable.region, `%${region}%`));
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    query = query.where(and(...conditions));
  }

  const destinations = await query;

  let filtered = destinations;
  if (difficulty) {
    const diffMap: Record<string, [number, number]> = {
      easy: [0, 50],
      moderate: [51, 75],
      hard: [76, 100],
    };
    const range = diffMap[difficulty.toLowerCase()];
    if (range) filtered = filtered.filter(d => d.difficulty >= range[0] && d.difficulty <= range[1]);
  }
  if (duration) {
    filtered = filtered.filter(d => d.duration.toLowerCase().includes(duration.toLowerCase()));
  }

  res.json(filtered);
});

router.post("/", async (req, res) => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [dest] = await db.insert(destinationsTable).values({
    ...parsed.data,
    seatsLeft: parsed.data.seatsTotal,
    bookingStatus: `Open - ${parsed.data.seatsTotal} seats left`,
    itinerary: (parsed.data.itinerary as string[]) ?? [],
    elevationPoints: (parsed.data.elevationPoints as number[]) ?? [],
  }).returning();
  res.status(201).json(dest);
});

router.get("/:id", async (req, res) => {
  const parsed = GetDestinationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, parsed.data.id));
  if (!dest) return res.status(404).json({ error: "Not found" });
  res.json(dest);
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateDestinationParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateDestinationBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db.update(destinationsTable)
    .set(bodyParsed.data as Partial<typeof destinationsTable.$inferInsert>)
    .where(eq(destinationsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteDestinationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(destinationsTable).where(eq(destinationsTable.id, parsed.data.id));
  res.status(204).end();
});

export default router;
