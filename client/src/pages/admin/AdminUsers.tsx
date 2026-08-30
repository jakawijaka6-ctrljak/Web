import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AdminUser } from "../../api/types";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const { data } = await api.get<AdminUser[]>("/admin/users");
    setUsers(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleTopup(id: string) {
    const raw = amounts[id];
    const amount = Number(raw);
    if (!amount) return;
    setBusyId(id);
    try {
      await api.post(`/admin/users/${id}/topup`, { amount });
      setAmounts((prev) => ({ ...prev, [id]: "" }));
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Pengguna</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Perangkat</th>
              <th className="py-2 pr-4">Saldo</th>
              <th className="py-2 pr-4">Top up</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4 text-slate-500">{u.email}</td>
                <td className="py-2 pr-4">
                  <span className={u.session?.status === "CONNECTED" ? "text-emerald-600" : "text-slate-400"}>
                    {u.session?.status ?? "DISCONNECTED"}
                  </span>
                </td>
                <td className="py-2 pr-4 font-medium">{formatRupiah(u.balance)}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={amounts[u.id] ?? ""}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleTopup(u.id)}
                      disabled={busyId === u.id}
                      className="rounded-lg bg-emerald-600 text-white px-3 py-1 text-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Tambah
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Belum ada pengguna
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
