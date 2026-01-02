// front/src/pages/onboarding.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/apiClient/base44Client";
import PageShell from "@/components/ui/page-shell.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";

export default function Onboarding() {
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#A78BFA");
  const [accentColor, setAccentColor] = useState("#39FF14");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Atualiza tenant com as configs básicas de branding
      await base44.entities.Tenant.update({
        name: agencyName || undefined,
        primaryColor,
        accentColor,
        logoUrl: logoUrl || undefined,
      });

      // Depois do onboarding, manda pro dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Erro ao salvar as configurações iniciais da agência."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl">
        <div className="border border-[var(--border)] rounded-[16px] bg-white shadow-[var(--shadow-sm)] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Bem-vindo ao KONDOR STUDIO
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Vamos configurar rapidamente a identidade da sua agencia para
              personalizar o portal do cliente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Nome da agencia</Label>
              <Input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Ex.: Allianz Marketing, Alpha Social, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Cor primaria</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-10 rounded-[10px] border border-[var(--border)] cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#A78BFA"
                  />
                </div>
              </div>

              <div>
                <Label>Cor de acento</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-10 rounded-[10px] border border-[var(--border)] cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#39FF14"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>URL do logo (opcional)</Label>
              <Input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://seu-cdn.com/logo.png"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Voce podera trocar isso depois nas configuracoes do tenant.
              </p>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Concluir e ir para o dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
