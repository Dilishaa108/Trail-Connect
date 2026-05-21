import { Router } from "express";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const destinationId = Number(req.params.destinationId);
  if (isNaN(destinationId)) return res.status(400).json({ error: "Invalid destination id" });

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.destinationId, destinationId))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews);
});

router.post("/", async (req, res) => {
  const destinationId = Number(req.params.destinationId);
  if (isNaN(destinationId)) return res.status(400).json({ error: "Invalid destination id" });

  const { userId, rating, comment } = req.body;

  if (!userId || typeof userId !== "number") return res.status(400).json({ error: "userId required" });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "rating must be 1–5" });
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) return res.status(400).json({ error: "comment required" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "User not found" });

  const [review] = await db.insert(reviewsTable).values({
    userId,
    destinationId,
    rating,
    comment: comment.trim(),
    username: user.username,
  }).returning();

  res.status(201).json(review);
});

export default router;
