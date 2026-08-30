import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { PhoneNumberRecord } from "../../api/types";

export default function AdminNumbers() {
  const [available, setAvailable] = useState(0);
  const [used, setUsed] = useState(0);
  const [recent, setRecent] = useState<PhoneNumberRecord[]>([]);
  const [numbersText, setNumbersText] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refresh() {
    const { data } = await api.get("/admin/numbers");
    setAvailable(data.available);
    setUsed(data.used);
    setRecent(data.recent);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRestock() {
    const numbers = numbersText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (numbers.length === 0) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const { data } = await api.post("/admin/numbers/restock", { numbers, batchLabel: batchLabel || undefined });
      setFeedback(`${data.added} nomor baru ditambahkan dari ${data.submitted} yang dikirim.`);
      setNumbersText("");
      refresh();
    } catch (err: any) {
      setFeedback(err.response?.data?.error ?? "Gagal restock nomor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">Stok Tersedia</p>
          <p className="text-2xl font-semibold text-emerald-600">{available}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">Sudah Terpakai</p>
          <p className="text-2xl font-semibold text-slate-900">{used}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Restock Nomor</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Label batch (opsional)</label>
            <input
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="mis. Batch Agustus"
              className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp (satu per baris)</label>
            <textarea
              value={numbersText}
              onChange={(e) => setNumbersText(e.target.value)}
              rows={8}
              placeholder={"6281234567890\n6281234567891"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            onClick={handleRestock}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Restock"}
          </button>
          {feedback && <p className="text-sm text-slate-700">{feedback}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Nomor Terbaru</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Nomor</th>
                <th className="py-2 pr-4">Batch</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ditambahkan</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{n.number}</td>
                  <td className="py-2 pr-4">{n.batchLabel ?? "-"}</td>
                  <td className="py-2 pr-4">
                    <span className={n.status === "AVAILABLE" ? "text-emerald-600" : "text-slate-400"}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{new Date(n.createdAt).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Belum ada nomor
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
