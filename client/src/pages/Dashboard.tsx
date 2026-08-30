import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import type { DeviceState, MessageRecord, Template } from "../api/types";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

const STATUS_LABEL: Record<DeviceState["status"], string> = {
  DISCONNECTED: "Belum terhubung",
  CONNECTING: "Menghubungkan...",
  CONNECTED: "Terhubung",
};

export default function Dashboard() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refreshStatus = useCallback(async () => {
    const { data } = await api.get<DeviceState>("/user/device/status");
    setDevice(data);
    return data;
  }, []);

  const refreshMessages = useCallback(async () => {
    const { data } = await api.get<MessageRecord[]>("/user/messages");
    setMessages(data);
  }, []);

  useEffect(() => {
    api.get<Template[]>("/user/templates").then((res) => {
      setTemplates(res.data);
      if (res.data.length > 0) setTemplateId(res.data[0].id);
    });
    refreshStatus();
    refreshMessages();
  }, [refreshStatus, refreshMessages]);

  useEffect(() => {
    if (!device || device.status === "DISCONNECTED") return;
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [device?.status, refreshStatus]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const data = await api.post("/user/device/connect").then((res) => res.data);
      setDevice(data);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await api.post("/user/device/disconnect");
    setDevice({ status: "DISCONNECTED", qrDataUrl: null, phoneNumber: null });
  }

  async function handleSend() {
    setSending(true);
    setResult(null);
    try {
      const { data } = await api.post("/user/blast", { templateId, quantity });
      updateUser({ balance: data.remainingBalance });
      let summary = `Terkirim ${data.sent}, gagal ${data.failed}.`;
      if (data.outOfStock) summary += " Stok nomor habis.";
      if (data.outOfBalance) summary += " Saldo tidak cukup.";
      setResult(summary);
      refreshMessages();
    } catch (err: any) {
      setResult(err.response?.data?.error ?? "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Perangkat WhatsApp</h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-2">
              Status: <span className="font-medium text-slate-900">{STATUS_LABEL[device?.status ?? "DISCONNECTED"]}</span>
            </p>
            {device?.phoneNumber && <p className="text-sm text-slate-600 mb-4">Nomor: {device.phoneNumber}</p>}
            {device?.status !== "CONNECTED" ? (
              <button
                onClick={handleConnect}
                disabled={connecting || device?.status === "CONNECTING"}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
              >
                {connecting || device?.status === "CONNECTING" ? "Menunggu QR..." : "Hubungkan Perangkat"}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="rounded-lg border border-red-200 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50"
              >
                Putuskan Perangkat
              </button>
            )}
          </div>
          {device?.qrDataUrl && device.status === "CONNECTING" && (
            <div className="text-center">
              <img src={device.qrDataUrl} alt="QR WhatsApp" className="w-48 h-48 border border-slate-200 rounded-lg" />
              <p className="text-xs text-slate-500 mt-2">Scan dengan WhatsApp &gt; Perangkat Tertaut</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Kirim Pesan</h2>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {templates.length === 0 && <option value="">Belum ada template</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah pesan</label>
            <input
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {templateId && (
          <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">
            {templates.find((t) => t.id === templateId)?.content}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-2">Biaya: Rp1.200 / pesan terkirim</p>
        <button
          onClick={handleSend}
          disabled={sending || !templateId || device?.status !== "CONNECTED"}
          className="mt-4 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {sending ? "Mengirim..." : "Kirim Blast"}
        </button>
        {device?.status !== "CONNECTED" && (
          <p className="text-xs text-amber-600 mt-2">Hubungkan perangkat WhatsApp dulu sebelum mengirim.</p>
        )}
        {result && <p className="text-sm text-slate-700 mt-3">{result}</p>}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Pesan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Waktu</th>
                <th className="py-2 pr-4">Template</th>
                <th className="py-2 pr-4">Nomor</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-600">{new Date(m.createdAt).toLocaleString("id-ID")}</td>
                  <td className="py-2 pr-4">{m.template.title}</td>
                  <td className="py-2 pr-4">{m.phoneNumber.number}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        m.status === "SENT"
                          ? "text-emerald-600"
                          : m.status === "FAILED"
                            ? "text-red-600"
                            : "text-amber-600"
                      }
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{formatRupiah(m.cost)}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada pesan terkirim
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
