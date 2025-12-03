import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../base44Client";

export default function Onboarding() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [form, setForm] = useState({
    agency_name: "",
    primary_color: "#A78BFA",
    accent_color: "#39FF14",
    logo_url: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTenant() {
      try {
        const [current] = await base44.entities.Tenant.getCurrent();
        setTenant(current);
        setForm({
          agency_name: current.agency_name || "",
          primary_color: current.primary_color || "#A78BFA",
          accent_color: current.accent_color || "#39FF14",
          logo_url: current.logo_url || "",
        });
      } catch (err) {
        console.error("Erro ao carregar tenant:", err);
        setError("Erro ao carregar dados da agência");
      }
    }
    loadTenant();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await base44.entities.Tenant.update(form);
      navigate("/clients", { replace: true });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err?.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Configurações Iniciais
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome da Agência
            </label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={form.agency_name}
              onChange={(e) =>
                setForm({ ...form, agency_name: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cor Primária
              </label>
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) =>
                  setForm({ ...form, primary_color: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cor de Acento
              </label>
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) =>
                  setForm({ ...form, accent_color: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo da Agência (URL)
            </label>
            <input
              type="url"
              placeholder="https://cdn.exemplo.com/logo.png"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={form.logo_url}
              onChange={(e) =>
                setForm({ ...form, logo_url: e.target.value })
              }
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Concluir e Avançar"}
          </button>
        </form>
      </div>
    </div>
  );
}
