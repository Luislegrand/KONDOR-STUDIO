// front/src/pages/clientlogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Clientlogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      const token = data.accessToken || data.token;
      if (!token) {
        setError("Resposta de login inválida (sem token)");
        setLoading(false);
        return;
      }

      localStorage.setItem("kondor_client_token", token);

      if (data.client) {
        localStorage.setItem("kondor_client_info", JSON.stringify(data.client));
      }

      navigate("/clientportal", { replace: true });
    } catch (err) {
      console.error("Erro no client-login:", err);
      setError("Erro interno ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Login do Cliente
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="cliente@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
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
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
