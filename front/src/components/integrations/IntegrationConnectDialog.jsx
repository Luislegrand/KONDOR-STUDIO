import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function buildSettings(fields, formData, kind) {
  const settings = { kind };
  fields.forEach((field) => {
    let value = formData[field.name];
    if (typeof value === "string") value = value.trim();
    if (!value) return;

    if (field.format === "json") {
      try {
        settings[field.name] = JSON.parse(value);
        return;
      } catch (_) {
        settings[field.name] = value;
        return;
      }
    }

    settings[field.name] = value;
  });
  return settings;
}

export default function IntegrationConnectDialog({
  open,
  onOpenChange,
  definition,
  existing,
}) {
  const queryClient = useQueryClient();
  const fields = definition?.fields || [];

  const initialValues = useMemo(() => {
    const base = {};
    fields.forEach((field) => {
      base[field.name] = normalizeValue(existing?.settings?.[field.name] ?? "");
    });
    return base;
  }, [existing, fields]);

  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    if (!open) return;
    setFormData(initialValues);
  }, [open, initialValues]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!definition) throw new Error("Integração inválida.");
      const settings = buildSettings(fields, formData, definition.kind);
      if (existing?.id) {
        return base44.entities.Integration.update(existing.id, {
          status: "CONNECTED",
          settings,
        });
      }
      return base44.entities.Integration.create({
        provider: definition.provider,
        providerName: definition.title,
        ownerType: "AGENCY",
        ownerKey: definition.ownerKey,
        status: "CONNECTED",
        settings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onOpenChange(false);
    },
  });

  const oauthMutation = useMutation({
    mutationFn: async () => {
      const data = await base44.jsonFetch(definition.oauth?.endpoint, { method: "GET" });
      if (!data?.url) throw new Error("Resposta inválida do servidor (faltou url).");
      return data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  if (!definition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{definition.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{definition.dialogDescription}</p>
          </div>

          {definition.oauth ? (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{definition.oauth.title}</p>
                  <p className="text-xs text-gray-600">{definition.oauth.subtitle}</p>
                </div>
                <Button
                  type="button"
                  onClick={() => oauthMutation.mutate()}
                  disabled={oauthMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {oauthMutation.isPending ? "Conectando..." : definition.oauth.label}
                </Button>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              connectMutation.mutate();
            }}
            className="space-y-5"
          >
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    rows={field.rows || 6}
                    value={formData[field.name] || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : (
                  <Input
                    type={field.type || "text"}
                    value={formData[field.name] || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
                {field.helper ? (
                  <p className="text-[11px] text-gray-500">{field.helper}</p>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={connectMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? "Salvando..." : "Salvar conexão"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
