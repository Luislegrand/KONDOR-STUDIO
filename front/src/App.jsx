import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout.jsx";

// IMPORTS DAS PAGES
import Dashboard from "./pages/Dashboard.jsx";
import Clients from "./pages/Clients.jsx";
import Posts from "./pages/Posts.jsx";
import Tasks from "./pages/Tasks.jsx";
import Biblioteca from "./pages/Biblioteca.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Team from "./pages/Team.jsx";
import Metrics from "./pages/Metrics.jsx";
import Integrations from "./pages/Integrations.jsx";
import Settings from "./pages/Settings.jsx";
import ClientPortal from "./pages/ClientPortal.jsx";
import Pricing from "./pages/Pricing.jsx";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>

          {/* ROTAS PRINCIPAIS */}
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

          {/* CLIENT PORTAL */}
          <Route path="/portal" element={<ClientPortal />} />

          {/* PRICING */}
          <Route path="/pricing" element={<Pricing />} />

          {/* REDIRECIONAMENTO PADRÃO */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </Layout>
    </Router>
  );
}
