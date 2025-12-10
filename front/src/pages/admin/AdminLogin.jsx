// path: front/src/pages/admin/AdminLogin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { base44 } from "@/apiClient/base44Client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/admin";
  const reason = location.state?.reason;

  useEffect(() => {
    const auth = base44.storage.loadAuthFromStorage?.();
    if (auth?.user?.role === "SUPER_ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await base44.auth.login({ email, password });

      if (data?.user?.role !== "SUPER_ADMIN") {
        base44.storage.clearAuthFromStorage?.();
        setError("Acesso restrito. Este usuário não é SUPER_ADMIN.");
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-purple-500/10 text-purple-200 px-4 py-1 text-xs font-semibold tracking-widest uppercase gap-2">
            <Shield className="w-3.5 h-3.5" />
            Kondor Control Center
          </div>
          <h1 className="text-3xl font-semibold text-white">
            Login restrito para Super Admin
          </h1>
          <p className="text-sm text-slate-400">
            Ambiente exclusivo para monitorar tenants, billing, jobs e suporte.
          </p>
          {reason === "forbidden" && (
            <p className="text-xs text-amber-300">
              Sessão anterior não tinha permissão para acessar o painel mestre.
            </p>
          )}
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl shadow-2xl shadow-purple-500/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <fieldset className="space-y-4" disabled={loading}>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-400">
                  E-mail do Super Admin
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="superadmin@kondor.studio"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-400">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </fieldset>

            <div aria-live="assertive" className="min-h-[1.5rem]">
              {error && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-semibold px-4 py-3 shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando credenciais...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Entrar como Super Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Precisa acessar o painel padrão da agência?{" "}
            <Link to="/login" className="text-purple-300 hover:text-purple-200 font-medium">
              Clique aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
