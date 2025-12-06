import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/apiClient/base44Client";

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    agencyName: "",
    tenantSlug: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(() => {
    if (form.tenantSlug) return slugify(form.tenantSlug);
    return slugify(form.agencyName || "");
  }, [form.agencyName, form.tenantSlug]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.password || form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    const payload = {
      tenantName: form.agencyName.trim(),
      tenantSlug: suggestedSlug || undefined,
      userName: form.adminName.trim(),
      userEmail: form.email.trim().toLowerCase(),
      password: form.password,
    };

    if (!payload.tenantName || !payload.tenantSlug || !payload.userName || !payload.userEmail) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.registerTenant(payload);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err?.message || "Falha ao criar sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-2xl border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-purple-600 tracking-wide uppercase">
            Teste gratuito de 3 dias
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Crie sua conta no KONDOR STUDIO
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Configure sua agência, adicione clientes e use todos os módulos durante o período de teste.
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome da agência *
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.agencyName}
                onChange={handleChange("agencyName")}
                placeholder="Ex.: Alfa Social"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug (subdomínio) *
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.tenantSlug}
                onChange={handleChange("tenantSlug")}
                placeholder="ex: alfa-social"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Usaremos: <span className="font-medium">{suggestedSlug || "seu-slug"}</span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome do administrador *
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.adminName}
                onChange={handleChange("adminName")}
                placeholder="Seu nome"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                E-mail corporativo *
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="voce@agencia.com"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirmar senha *
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="repita sua senha"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 transition disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Começar meu teste grátis"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link to="/login" className="text-purple-600 font-medium hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
