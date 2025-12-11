import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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

  const inputBaseClass =
    "w-full rounded-2xl border-[1.5px] border-[#C4B5FD] bg-white/70 px-4 py-3 text-[15px] text-slate-900 placeholder:text-gray-400 shadow-[0_5px_25px_rgba(124,58,237,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] focus:border-[#A78BFA] transition-all duration-150";
  const labelClass = "block text-sm font-medium text-gray-500 mb-2";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_55%)] from-slate-900/5 via-white to-white px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-purple-600 tracking-[0.3em] uppercase">
            Teste gratuito de 3 dias
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Comece sua nova operação com a Kondor
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Libere o acesso completo em minutos, personalize seu endereço e convide seu time para um ambiente
            premium com automações, biblioteca criativa e métricas em tempo real.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/60 via-white/20 to-white/60 blur-3xl" aria-hidden />
          <form
            onSubmit={handleSubmit}
            noValidate
            className="relative rounded-[28px] border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_70px_rgba(79,70,229,0.12)] p-8 md:p-12"
          >
            <fieldset className="grid gap-8" disabled={loading}>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className={labelClass} htmlFor="agencyName">
                      Nome da agência *
                    </label>
                    <input
                      id="agencyName"
                      name="agencyName"
                      value={form.agencyName}
                      onChange={handleChange("agencyName")}
                      placeholder="Ex.: Orion Collective"
                      className={inputBaseClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="adminName">
                      Nome do administrador *
                    </label>
                    <input
                      id="adminName"
                      name="adminName"
                      value={form.adminName}
                      onChange={handleChange("adminName")}
                      placeholder="Seu nome completo"
                      className={inputBaseClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="password">
                      Senha *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange("password")}
                      placeholder="Mínimo 6 caracteres"
                      className={inputBaseClass}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="md:max-w-xs">
                    <label className={labelClass} htmlFor="tenantSlug">
                      Slug / subdomínio *
                    </label>
                    <input
                      id="tenantSlug"
                      name="tenantSlug"
                      pattern="[a-z0-9-]+"
                      value={form.tenantSlug}
                      onChange={handleChange("tenantSlug")}
                      placeholder="ex: orion"
                      className={`${inputBaseClass} md:text-[14px]`}
                    />
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      Endereço sugerido:{" "}
                      <span className="font-semibold text-gray-700">{suggestedSlug || "sua-agencia"}</span>. Você pode
                      ajustar quando quiser para refletir melhor o nome da agência.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      E-mail corporativo *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="voce@agencia.com"
                      className={inputBaseClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="confirmPassword">
                      Confirmar senha *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      placeholder="Repita sua senha"
                      className={inputBaseClass}
                      required
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <div aria-live="assertive" className="min-h-[1.5rem] mt-6">
              {error && (
                <div className="text-xs text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-2">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/60">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-sm font-semibold tracking-wide text-white px-6 py-4 shadow-xl shadow-[#7C3AED]/30 hover:scale-[1.02] transition-all duration-150 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Começar meu teste grátis"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link to="/login" className="text-purple-600 font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
