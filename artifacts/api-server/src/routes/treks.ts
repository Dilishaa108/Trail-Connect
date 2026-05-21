import { Router } from "express";
import { db, treksTable, destinationsTable, usersTable, guidesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListTreksQueryParams, CreateTrekBody, GetTrekParams, UpdateTrekParams, UpdateTrekBody, DeleteTrekParams } from "@workspace/api-zod";

const router = Router();

async function enrichTrek(trek: typeof treksTable.$inferSelect) {
  const [destination] = await db.select({ name: destinationsTable.name })
    .from(destinationsTable)
    .where(eq(destinationsTable.id, trek.destinationId));

  let guideName: string | null = null;
  if (trek.guideId) {
    const [guide] = await db.select({ name: guidesTable.name })
      .from(guidesTable)
      .where(eq(guidesTable.id, trek.guideId));
    guideName = guide?.name ?? null;
  }

  return {
    ...trek,
    destinationName: destination?.name ?? null,
    guideName,
  };
}

router.get("/", async (req, res) => {
  const queryParsed = ListTreksQueryParams.safeParse(req.query);
  const { userId, status } = queryParsed.success ? queryParsed.data : {};

  let treks = await db.select().from(treksTable);

  if (userId !== undefined) treks = treks.filter(t => t.userId === Number(userId));
  if (status) treks = treks.filter(t => t.status === status);

  const enriched = await Promise.all(treks.map(enrichTrek));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const parsed = CreateTrekBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [trek] = await db.insert(treksTable).values({
    ...parsed.data,
    status: "planned",
    guideId: parsed.data.guideId ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();

  // Update destination seats
  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, trek.destinationId));
  if (dest && dest.seatsLeft > 0) {
    const newLeft = Math.max(0, dest.seatsLeft - trek.groupSize);
    await db.update(destinationsTable).set({
      seatsLeft: newLeft,
      bookingStatus: newLeft === 0 ? "Fully Booked" : newLeft <= 3 ? `Filling fast - ${newLeft} seats left` : `Open - ${newLeft} seats left`,
    }).where(eq(destinationsTable.id, trek.destinationId));
  }

  // Increment user total treks
  await db.update(usersTable)
    .set({ totalTreks: (await db.select({ t: usersTable.totalTreks }).from(usersTable).where(eq(usersTable.id, trek.userId)))[0]?.t ?? 0 + 1 })
    .where(eq(usersTable.id, trek.userId));

  const enriched = await enrichTrek(trek);
  res.status(201).json(enriched);
});

router.get("/:id", async (req, res) => {
  const parsed = GetTrekParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [trek] = await db.select().from(treksTable).where(eq(treksTable.id, parsed.data.id));
  if (!trek) return res.status(404).json({ error: "Not found" });
  const enriched = await enrichTrek(trek);
  res.json(enriched);
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateTrekParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateTrekBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updateData: Partial<typeof treksTable.$inferInsert> = {};
  if (bodyParsed.data.status) updateData.status = bodyParsed.data.status;
  if (bodyParsed.data.endDate) updateData.endDate = bodyParsed.data.endDate;
  if (bodyParsed.data.guideId !== undefined) updateData.guideId = bodyParsed.data.guideId;
  if (bodyParsed.data.notes !== undefined) updateData.notes = bodyParsed.data.notes;
  if (bodyParsed.data.completionRating !== undefined) updateData.completionRating = bodyParsed.data.completionRating;

  const [updated] = await db.update(treksTable)
    .set(updateData)
    .where(eq(treksTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  // If completed, increment user completed treks
  if (bodyParsed.data.status === "completed") {
    const [user] = await db.select({ completedTreks: usersTable.completedTreks })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId));
    if (user) {
      await db.update(usersTable)
        .set({ completedTreks: (user.completedTreks ?? 0) + 1 })
        .where(eq(usersTable.id, updated.userId));
    }
  }

  const enriched = await enrichTrek(updated);
  res.json(enriched);
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteTrekParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [trek] = await db.select().from(treksTable).where(eq(treksTable.id, parsed.data.id));
  if (!trek) return res.status(204).end();

  // Restore seats
  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, trek.destinationId));
  if (dest) {
    const newLeft = dest.seatsLeft + trek.groupSize;
    await db.update(destinationsTable).set({
      seatsLeft: newLeft,
      bookingStatus: newLeft === 0 ? "Fully Booked" : `Open - ${newLeft} seats left`,
    }).where(eq(destinationsTable.id, trek.destinationId));
  }

  await db.delete(treksTable).where(eq(treksTable.id, parsed.data.id));
  res.status(204).end();
});

export default router;
