import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { pino } from "pino";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { prisma } from "../lib/prisma";

const SESSIONS_DIR = path.join(process.cwd(), "wa-sessions");
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

interface SessionEntry {
  sock: WASocket | null;
  qrDataUrl: string | null;
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED";
  phoneNumber: string | null;
}

const sessions = new Map<string, SessionEntry>();
const logger = pino({ level: "silent" });

function getEntry(userId: string): SessionEntry {
  let entry = sessions.get(userId);
  if (!entry) {
    entry = { sock: null, qrDataUrl: null, status: "DISCONNECTED", phoneNumber: null };
    sessions.set(userId, entry);
  }
  return entry;
}

async function persistStatus(userId: string, status: SessionEntry["status"], phoneNumber?: string | null) {
  await prisma.whatsAppSession.upsert({
    where: { userId },
    update: { status, ...(phoneNumber !== undefined ? { phoneNumber } : {}) },
    create: { userId, status, phoneNumber: phoneNumber ?? null },
  });
}

export async function startSession(userId: string): Promise<void> {
  const entry = getEntry(userId);
  if (entry.sock && (entry.status === "CONNECTED" || entry.status === "CONNECTING")) {
    return;
  }

  const authDir = path.join(SESSIONS_DIR, userId);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: logger as any,
    printQRInTerminal: false,
  });

  entry.sock = sock;
  entry.status = "CONNECTING";
  await persistStatus(userId, "CONNECTING");

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      entry.qrDataUrl = await QRCode.toDataURL(qr);
    }

    if (connection === "open") {
      entry.status = "CONNECTED";
      entry.qrDataUrl = null;
      entry.phoneNumber = sock.user?.id?.split(":")[0] ?? null;
      await persistStatus(userId, "CONNECTED", entry.phoneNumber);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      entry.status = "DISCONNECTED";
      entry.qrDataUrl = null;
      entry.sock = null;
      await persistStatus(userId, "DISCONNECTED");

      if (loggedOut) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
    }
  });
}

export function getSessionState(userId: string) {
  const entry = getEntry(userId);
  return {
    status: entry.status,
    qrDataUrl: entry.qrDataUrl,
    phoneNumber: entry.phoneNumber,
  };
}

export async function stopSession(userId: string): Promise<void> {
  const entry = getEntry(userId);
  if (entry.sock) {
    try {
      await entry.sock.logout();
    } catch {
      // ignore, socket may already be closed
    }
    entry.sock = null;
  }
  entry.status = "DISCONNECTED";
  entry.qrDataUrl = null;
  await persistStatus(userId, "DISCONNECTED");
  fs.rmSync(path.join(SESSIONS_DIR, userId), { recursive: true, force: true });
}

export async function sendWhatsAppMessage(userId: string, phoneNumber: string, text: string): Promise<void> {
  const entry = getEntry(userId);
  if (!entry.sock || entry.status !== "CONNECTED") {
    throw new Error("WhatsApp device tidak terhubung");
  }
  const digits = phoneNumber.replace(/[^0-9]/g, "");
  const jid = `${digits}@s.whatsapp.net`;
  await entry.sock.sendMessage(jid, { text });
}
