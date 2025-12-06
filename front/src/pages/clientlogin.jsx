// front/src/pages/clientlogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/apiClient/base44Client";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // login de cliente usa endpoint dedicado no backend:
      // POST /api/auth/client-login
      const res = await base44.rawFetch("/auth/client-login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: portalPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Falha ao fazer login");
      }

      // Armazenar token de cliente (separado do token da agência)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "kondor_client_auth",
          JSON.stringify(data)
        );
      }

      // Redireciona para o portal do cliente
      navigate("/clientportal", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Portal do Cliente
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acesse para aprovar posts, ver métricas e relatórios.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="seuemail@empresa.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Senha do portal
            </label>
            <input
              type="password"
              required
              value={portalPassword}
              onChange={(e) => setPortalPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Digite sua senha"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              No primeiro acesso, você definirá a senha do portal.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-purple-500 text-white text-sm font-medium px-4 py-2 hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Entrando..." : "Entrar no portal"}
          </button>
        </form>
      </div>
    </div>
  );
}
