import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import type { Role } from "../api/types";

export default function ProtectedRoute({ role }: { role?: Role }) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  }
  return <Outlet />;
}
