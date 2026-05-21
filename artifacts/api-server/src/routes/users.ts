import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody, LoginUserBody, GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
    totalTreks: usersTable.totalTreks,
    completedTreks: usersTable.completedTreks,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

router.post("/", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.username));
  if (existing.length > 0) return res.status(400).json({ error: "Username already taken" });

  const [user] = await db.insert(usersTable).values({
    username: parsed.data.username,
    password: parsed.data.password,
    role: parsed.data.role ?? "user",
  }).returning();

  const { password: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

router.post("/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.username));
  if (!user || user.password !== parsed.data.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

router.get("/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [user] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
    totalTreks: usersTable.totalTreks,
    completedTreks: usersTable.completedTreks,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateUserParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateUserBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db.update(usersTable)
    .set(bodyParsed.data as Partial<typeof usersTable.$inferInsert>)
    .where(eq(usersTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  const { password: _, ...safeUser } = updated;
  res.json(safeUser);
});

export default router;
