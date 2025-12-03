// front/src/app.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout.jsx";

// PAGES DO PAINEL DA AGÊNCIA
import Dashboard from "./pages/dashboard.jsx";
import Clients from "./pages/clients.jsx";
import Posts from "./pages/posts.jsx";
import Tasks from "./pages/tasks.jsx";
import Biblioteca from "./pages/biblioteca.jsx";
import Financeiro from "./pages/financeiro.jsx";
import Team from "./pages/team.jsx";
import Metrics from "./pages/metrics.jsx";
import Integrations from "./pages/integrations.jsx";
import Settings from "./pages/settings.jsx";
import Pricing from "./pages/pricing.jsx";

// PORTAL DO CLIENTE
import Clientportal from "./pages/clientportal.jsx";
import Clientlogin from "./pages/clientlogin.jsx";

export default function App() {
  return (
    <Routes>
      {/* ============================
          ROTAS DO CLIENTE (SEM LAYOUT)
         ============================ */}
      <Route path="/clientlogin" element={<Clientlogin />} />
      <Route path="/clientportal" element={<Clientportal />} />
      {/* alias legado */}
      <Route path="/portal" element={<Clientportal />} />

      {/* ============================
          ROTAS DA AGÊNCIA (COM LAYOUT)
         ============================ */}
      <Route element={<Layout />}>
        {/* rota base cai no dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/team" element={<Team />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* fallback dentro do layout */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
