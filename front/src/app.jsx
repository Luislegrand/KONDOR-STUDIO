import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout.jsx";

// IMPORTS DAS PAGES
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
import Clientportal from "./pages/clientportal.jsx";
import Pricing from "./pages/pricing.jsx";

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
          <Route path="/portal" element={<Clientportal />} />

          {/* PRICING */}
          <Route path="/pricing" element={<Pricing />} />

          {/* REDIRECIONAMENTO PADRÃO */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </Layout>
    </Router>
  );
}
