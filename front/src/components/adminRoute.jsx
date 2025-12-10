// front/src/components/adminRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { base44 } from "@/apiClient/base44Client";

const AdminRoute = () => {
  const location = useLocation();
  const token = base44.storage.getAccessToken();
  const auth = base44.storage.loadAuthFromStorage?.();
  const role = auth?.user?.role;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "SUPER_ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
