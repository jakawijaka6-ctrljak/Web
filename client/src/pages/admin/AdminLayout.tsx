import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/admin", label: "Ringkasan", end: true },
  { to: "/admin/numbers", label: "Database Nomor", end: false },
  { to: "/admin/templates", label: "Template Pesan", end: false },
  { to: "/admin/users", label: "Pengguna", end: false },
];

export default function AdminLayout() {
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                isActive ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
