import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";

import { Button } from "@/components/ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const PROVIDERS = [
  { value: "META", label: "Meta Ads (Facebook/Instagram)" },
  { value: "GOOGLE", label: "Google Ads" },
  { value: "TIKTOK", label: "TikTok Ads" },
  { value: "INSTAGRAM", label: "Instagram (orgânico/conta)" },
  { value: "FACEBOOK", label: "Facebook (orgânico/página)" },
  // WhatsApp sai daqui: ele tem onboarding oficial via card.
];

export default function NewIntegrationDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState("");
  const [configText, setConfigText] = useState("");

  const providerLabel = useMemo(() => {
    const found = PROVIDERS.find((p) => p.value === selectedProvider);
    return found?.label || selectedProvider;
  }, [selectedProvider]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProvider) throw new Error("Selecione um provedor");

      let parsedConfig = null;
      if (configText?.trim()) {
        try {
          parsedConfig = JSON.parse(configText);
        } catch {
          parsedConfig = { raw: configText };
        }
      }

      // OBS: aqui ainda é “genérico”.
      // Depois você pode trocar por OAuth por provider sem mudar a tela inteira.
      const payload = {
        provider: selectedProvider,
        status: "connected",
        config: parsedConfig,
      };

      return base44.entities.Integration.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onOpenChange(false);
      setSelectedProvider("");
      setConfigText("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova integração</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provedor" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProvider ? (
              <p className="text-[11px] text-gray-500">
                Você está conectando: <span className="font-medium">{providerLabel}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Configuração (opcional)</Label>
            <Textarea
              rows={6}
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder='Cole JSON (recomendado) ou texto livre. Ex: {"account_id":"...","token":"..."}'
            />
            <p className="text-[11px] text-gray-500">
              Dica: se colar JSON válido, salvamos estruturado; se não, salvamos em <code className="px-1 rounded bg-gray-100">raw</code>.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
              Cancelar
            </Button>

            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createMutation.isPending || !selectedProvider}
            >
              {createMutation.isPending ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
