import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

// --- Phone number pool ---

const restockSchema = z.object({
  numbers: z.array(z.string().min(5).max(20)).min(1).max(5000),
  batchLabel: z.string().max(100).optional(),
});

router.post("/numbers/restock", async (req, res) => {
  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { numbers, batchLabel } = parsed.data;
  const adminId = req.user!.userId;

  const cleaned = [...new Set(numbers.map((n) => n.replace(/[^0-9]/g, "")).filter(Boolean))];

  const existing = await prisma.phoneNumber.findMany({
    where: { number: { in: cleaned } },
    select: { number: true },
  });
  const existingSet = new Set(existing.map((e) => e.number));
  const toInsert = cleaned.filter((n) => !existingSet.has(n));

  const result = await prisma.phoneNumber.createMany({
    data: toInsert.map((number) => ({ number, batchLabel, addedById: adminId })),
  });

  res.status(201).json({ added: result.count, submitted: numbers.length });
});

router.get("/numbers", async (_req, res) => {
  const [available, used, recent] = await Promise.all([
    prisma.phoneNumber.count({ where: { status: "AVAILABLE" } }),
    prisma.phoneNumber.count({ where: { status: "USED" } }),
    prisma.phoneNumber.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, number: true, status: true, batchLabel: true, createdAt: true },
    }),
  ]);
  res.json({ available, used, recent });
});

router.delete("/numbers/:id", async (req, res) => {
  await prisma.phoneNumber.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ ok: true });
});

// --- Templates ---

const templateSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(4000),
});

router.get("/templates", async (_req, res) => {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: "desc" } });
  res.json(templates);
});

router.post("/templates", async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const template = await prisma.template.create({
    data: { ...parsed.data, createdById: req.user!.userId },
  });
  res.status(201).json(template);
});

router.put("/templates/:id", async (req, res) => {
  const parsed = templateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const template = await prisma.template
    .update({ where: { id: req.params.id }, data: parsed.data })
    .catch(() => null);
  if (!template) return res.status(404).json({ error: "Template tidak ditemukan" });
  res.json(template);
});

router.delete("/templates/:id", async (req, res) => {
  await prisma.template.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ ok: true });
});

// --- Users & balance ---

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      createdAt: true,
      session: { select: { status: true, phoneNumber: true } },
    },
  });
  res.json(users);
});

const topupSchema = z.object({
  amount: z.number().int(),
});

router.post("/users/:id/topup", async (req, res) => {
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await prisma.user
    .update({
      where: { id: req.params.id },
      data: { balance: { increment: parsed.data.amount } },
    })
    .catch(() => null);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json({ id: user.id, balance: user.balance });
});

// --- Stats ---

router.get("/stats", async (_req, res) => {
  const [totalUsers, sentMessages, numbersAvailable, numbersUsed] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.message.findMany({ where: { status: "SENT" }, select: { cost: true } }),
    prisma.phoneNumber.count({ where: { status: "AVAILABLE" } }),
    prisma.phoneNumber.count({ where: { status: "USED" } }),
  ]);
  const totalRevenue = sentMessages.reduce((sum, m) => sum + m.cost, 0);
  res.json({
    totalUsers,
    totalMessagesSent: sentMessages.length,
    totalRevenue,
    numbersAvailable,
    numbersUsed,
  });
});

export default router;
