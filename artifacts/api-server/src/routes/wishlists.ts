import { Router } from "express";
import { db, wishlistsTable, destinationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const userId = Number(req.query.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "userId required" });

  const items = await db
    .select({
      id: wishlistsTable.id,
      userId: wishlistsTable.userId,
      destinationId: wishlistsTable.destinationId,
      createdAt: wishlistsTable.createdAt,
      destination: destinationsTable,
    })
    .from(wishlistsTable)
    .leftJoin(destinationsTable, eq(wishlistsTable.destinationId, destinationsTable.id))
    .where(eq(wishlistsTable.userId, userId))
    .orderBy(wishlistsTable.createdAt);

  res.json(items);
});

router.post("/", async (req, res) => {
  const { userId, destinationId } = req.body;
  if (!userId || !destinationId) return res.status(400).json({ error: "userId and destinationId required" });

  try {
    const [item] = await db.insert(wishlistsTable).values({
      userId: Number(userId),
      destinationId: Number(destinationId),
    }).returning();
    res.status(201).json(item);
  } catch {
    res.status(409).json({ error: "Already in wishlist" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  await db.delete(wishlistsTable).where(eq(wishlistsTable.id, id));
  res.status(204).end();
});

router.delete("/", async (req, res) => {
  const userId = Number(req.query.userId);
  const destinationId = Number(req.query.destinationId);
  if (isNaN(userId) || isNaN(destinationId)) return res.status(400).json({ error: "userId and destinationId required" });

  await db.delete(wishlistsTable).where(
    and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.destinationId, destinationId))
  );
  res.status(204).end();
});

export default router;
