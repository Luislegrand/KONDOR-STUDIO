import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout.jsx";

// IMPORTS DAS PAGES
import Dashboard from "./Pages/Dashboard.jsx";
import Clients from "./Pages/Clients.jsx";
import Posts from "./Pages/Posts.jsx";
import Tasks from "./Pages/Tasks.jsx";
import Biblioteca from "./Pages/Biblioteca.jsx";
import Financeiro from "./Pages/Financeiro.jsx";
import Team from "./Pages/Team.jsx";
import Metrics from "./Pages/Metrics.jsx";
import Integrations from "./Pages/Integrations.jsx";
import Settings from "./Pages/Settings.jsx";
import ClientPortal from "./Pages/ClientPortal.jsx";
import Pricing from "./Pages/Pricing.jsx";

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
