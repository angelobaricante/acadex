import { Navigate, Outlet } from "react-router-dom";
import { useSessionStore } from "@/lib/store";

export default function AuthGuard() {
  const user = useSessionStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
