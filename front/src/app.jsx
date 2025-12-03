import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Clients from "./pages/clients";
import ClientLogin from "./pages/clientlogin";
import ClientPortal from "./pages/clientportal";
import Login from "./pages/login";
import Onboarding from "./pages/onboarding";
import Layout from "./components/layout";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Login da agência */}
        <Route path="/login" element={<Login />} />

        {/* Onboarding pós-cadastro */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Portal do cliente (não protegido por PrivateRoute) */}
        <Route path="/clientlogin" element={<ClientLogin />} />
        <Route path="/clientportal" element={<ClientPortal />} />

        {/* Rotas protegidas da agência */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
