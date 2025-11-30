import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout.jsx";

// === PÁGINAS REAIS ===
import Dashboard from "./Pages/Dashboard";
import Clients from "./Pages/Clients";
import Posts from "./Pages/Posts";
import Tasks from "./Pages/Tasks";
import Biblioteca from "./Pages/Biblioteca";
import Financeiro from "./Pages/Financeiro";
import Team from "./Pages/Team";
import Metrics from "./Pages/Metrics";
import Integrations from "./Pages/Integrations";
import Settings from "./Pages/Settings";
import Pricing from "./Pages/Pricing";
import ClientPortal from "./Pages/ClientPortal";

// === LOGIN SIMPLES (por enquanto só visual) ===
function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white text-sm font-semibold">
            K
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              KONDOR STUDIO
            </span>
            <span className="text-xs text-slate-500">Acesso ao painel</span>
          </div>
        </div>

        <form className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="voce@agencia.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Senha
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            onClick={() => {
              // depois ligamos com a API; por enquanto só redireciona
              window.location.href = "/";
            }}
          >
            Entrar
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-500">
          Login ilustrativo. Depois conectamos com o backend /auth.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Login fora do layout principal */}
      <Route path="/login" element={<LoginPage />} />

      {/* Tudo que é “app” passa pelo Layout com sidebar */}
      <Route path="/" element={<Layout />}>
        {/* rota padrão */}
        <Route index element={<Dashboard />} />

        {/* rotas mapeando pras Páginas existentes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="posts" element={<Posts />} />
        <Route path="tarefas" element={<Tasks />} />
        <Route path="biblioteca" element={<Biblioteca />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="equipe" element={<Team />} />
        <Route path="metricas" element={<Metrics />} />
        <Route path="integracoes" element={<Integrations />} />
        <Route path="configuracoes" element={<Settings />} />

        {/* extras que você já tem */}
        <Route path="pricing" element={<Pricing />} />
        <Route path="portal" element={<ClientPortal />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
