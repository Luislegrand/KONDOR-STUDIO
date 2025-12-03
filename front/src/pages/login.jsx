import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../base44Client";
import Navbar from "../components/Navbar";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const tenant = window.__kondorTenant;
    if (tenant) {
      document.documentElement.style.setProperty("--primary", tenant.primary_color || "#A78BFA");
      document.documentElement.style.setProperty("--accent", tenant.accent_color || "#39FF14");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await base44.auth.login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Erro no login:", err);
      setError(err?.data?.error || err?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Login da Agência
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="sua.agencia@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
