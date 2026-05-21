import { Router } from "express";
import { db, guidesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListGuidesQueryParams, CreateGuideBody, UpdateGuideParams, UpdateGuideBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const queryParsed = ListGuidesQueryParams.safeParse(req.query);
  const { available, destinationId } = queryParsed.success ? queryParsed.data : {};

  let guides = await db.select().from(guidesTable);

  if (available !== undefined) {
    const isAvailable = available === true || available === "true" as unknown;
    guides = guides.filter(g => g.available === isAvailable);
  }
  if (destinationId !== undefined) {
    guides = guides.filter(g => g.destinationId === Number(destinationId));
  }

  res.json(guides);
});

router.post("/", async (req, res) => {
  const parsed = CreateGuideBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [guide] = await db.insert(guidesTable).values({
    ...parsed.data,
    available: parsed.data.available ?? true,
  }).returning();
  res.status(201).json(guide);
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateGuideParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateGuideBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db.update(guidesTable)
    .set(bodyParsed.data as Partial<typeof guidesTable.$inferInsert>)
    .where(eq(guidesTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
