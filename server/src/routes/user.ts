import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { startSession, getSessionState, stopSession, sendWhatsAppMessage } from "../services/whatsapp";

const router = Router();
const MESSAGE_COST = 1200;

router.use(requireAuth);

router.post("/device/connect", async (req, res) => {
  await startSession(req.user!.userId);
  res.json(getSessionState(req.user!.userId));
});

router.get("/device/status", (req, res) => {
  res.json(getSessionState(req.user!.userId));
});

router.post("/device/disconnect", async (req, res) => {
  await stopSession(req.user!.userId);
  res.json({ ok: true });
});

router.get("/templates", async (_req, res) => {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true },
  });
  res.json(templates);
});

const blastSchema = z.object({
  templateId: z.string().min(1),
  quantity: z.number().int().min(1).max(500),
});

router.post("/blast", async (req, res) => {
  const parsed = blastSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = req.user!.userId;
  const { templateId, quantity } = parsed.data;

  const sessionState = getSessionState(userId);
  if (sessionState.status !== "CONNECTED") {
    return res.status(400).json({ error: "Perangkat WhatsApp belum terhubung" });
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) {
    return res.status(404).json({ error: "Template tidak ditemukan" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  let remainingBalance = user.balance;

  let sent = 0;
  let failed = 0;
  let outOfStock = false;
  let outOfBalance = false;

  for (let i = 0; i < quantity; i++) {
    if (remainingBalance < MESSAGE_COST) {
      outOfBalance = true;
      break;
    }

    const claimedNumber = await prisma.$transaction(async (tx) => {
      const candidate = await tx.phoneNumber.findFirst({ where: { status: "AVAILABLE" } });
      if (!candidate) return null;
      return tx.phoneNumber.update({
        where: { id: candidate.id },
        data: { status: "USED", usedById: userId, usedAt: new Date() },
      });
    });

    if (!claimedNumber) {
      outOfStock = true;
      break;
    }

    try {
      await sendWhatsAppMessage(userId, claimedNumber.number, template.content);
      remainingBalance -= MESSAGE_COST;
      await prisma.$transaction([
        prisma.message.create({
          data: {
            userId,
            templateId,
            phoneNumberId: claimedNumber.id,
            status: "SENT",
            cost: MESSAGE_COST,
            sentAt: new Date(),
          },
        }),
        prisma.user.update({ where: { id: userId }, data: { balance: remainingBalance } }),
      ]);
      sent++;
    } catch (err) {
      await prisma.message.create({
        data: {
          userId,
          templateId,
          phoneNumberId: claimedNumber.id,
          status: "FAILED",
          cost: 0,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        },
      });
      failed++;
    }
  }

  res.json({ sent, failed, outOfStock, outOfBalance, remainingBalance });
});

router.get("/messages", async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      template: { select: { title: true } },
      phoneNumber: { select: { number: true } },
    },
  });
  res.json(messages);
});

export default router;
