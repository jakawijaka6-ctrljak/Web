import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-slate-900">WA Blast</span>
          <div className="flex items-center gap-4">
            {user?.role === "USER" && (
              <span className="text-sm text-slate-600">
                Saldo: <span className="font-semibold text-emerald-600">{formatRupiah(user.balance)}</span>
              </span>
            )}
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 border border-slate-200 rounded-md px-3 py-1.5"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
