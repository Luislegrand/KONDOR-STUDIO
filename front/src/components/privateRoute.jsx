import { Navigate, Outlet } from "react-router-dom";
import { base44 } from "../base44Client";

export default function PrivateRoute() {
  const token = base44.storage.getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
