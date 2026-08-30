import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AdminStats } from "../../api/types";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats").then((res) => setStats(res.data));
  }, []);

  const cards = stats
    ? [
        { label: "Total Pengguna", value: stats.totalUsers },
        { label: "Pesan Terkirim", value: stats.totalMessagesSent },
        { label: "Total Pendapatan", value: formatRupiah(stats.totalRevenue) },
        { label: "Stok Nomor Tersedia", value: stats.numbersAvailable },
        { label: "Nomor Terpakai", value: stats.numbersUsed },
      ]
    : [];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{c.value}</p>
        </div>
      ))}
      {!stats && <p className="text-slate-400 text-sm">Memuat statistik...</p>}
    </div>
  );
}
