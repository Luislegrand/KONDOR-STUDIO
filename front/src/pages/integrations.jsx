import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { base44 } from "../apiClient/base44Client";

import { Button } from "@/components/ui/button.jsx";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import {
  RefreshCw,
  Briefcase,
  Megaphone,
  BarChart3,
  MessageCircle,
  Music,
  Camera,
} from "lucide-react";

import IntegrationTile from "@/components/integrations/IntegrationTile.jsx";
import IntegrationConnectDialog from "@/components/integrations/IntegrationConnectDialog.jsx";

const DEFAULT_OWNER_KEY = "AGENCY";

const INTEGRATION_CATALOG = [
  {
    key: "meta-business",
    title: "Meta Business",
    subtitle: "Publicações orgânicas",
    description: "Conecte páginas e contas para publicar posts automaticamente.",
    provider: "META",
    ownerKey: "META_BUSINESS",
    kind: "meta_business",
    scope: "client",
    accentClass: "from-blue-500 to-indigo-500",
    icon: Briefcase,
    dialogDescription:
      "Informe os dados da conta Meta Business que será usada para publicar.",
    oauth: {
      title: "Conexão oficial via Meta",
      subtitle: "Recomendado para páginas e Instagram Business.",
      label: "Conectar via Meta",
      endpoint: "/integrations/meta/connect-url",
    },
    fields: [
      {
        name: "pageId",
        label: "ID da Página do Facebook",
        placeholder: "1234567890",
        required: true,
      },
      {
        name: "igBusinessId",
        label: "ID do Instagram Business",
        placeholder: "17841400000000000",
        required: false,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "EAAB...",
        required: true,
        helper: "Permissões: pages_manage_posts, instagram_content_publish.",
      },
    ],
  },
  {
    key: "meta-ads",
    title: "Meta Ads",
    subtitle: "Métricas e relatórios",
    description: "Importe resultados de campanhas para dashboards e relatórios.",
    provider: "META",
    ownerKey: "META_ADS",
    kind: "meta_ads",
    scope: "client",
    accentClass: "from-sky-500 to-cyan-500",
    icon: Megaphone,
    dialogDescription:
      "Configure a conta de anúncios usada para coletar métricas.",
    oauth: {
      title: "Conexão oficial via Meta Ads",
      subtitle: "Recomendado para acesso contínuo às campanhas.",
      label: "Conectar via Meta",
      endpoint: "/integrations/meta/connect-url",
    },
    fields: [
      {
        name: "adAccountId",
        label: "Ad Account ID",
        placeholder: "act_1234567890",
        required: true,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "EAAB...",
        required: true,
      },
      {
        name: "fields",
        label: "Métricas (opcional)",
        placeholder: "impressions,clicks,spend",
        required: false,
      },
    ],
  },
  {
    key: "google-analytics",
    title: "Google Analytics",
    subtitle: "GA4 + relatórios",
    description: "Extraia métricas do site e exporte relatórios automatizados.",
    provider: "GOOGLE",
    ownerKey: "GA4",
    kind: "google_analytics",
    scope: "client",
    accentClass: "from-amber-500 to-orange-500",
    icon: BarChart3,
    dialogDescription:
      "Cadastre a propriedade GA4 e as credenciais de acesso.",
    fields: [
      {
        name: "propertyId",
        label: "GA4 Property ID",
        placeholder: "123456789",
        required: true,
      },
      {
        name: "measurementId",
        label: "Measurement ID (opcional)",
        placeholder: "G-XXXXXXX",
        required: false,
      },
      {
        name: "serviceAccountJson",
        label: "Service Account JSON",
        type: "textarea",
        placeholder: "{\n  \"type\": \"service_account\"\n}",
        required: true,
        format: "json",
      },
    ],
  },
  {
    key: "whatsapp-business",
    title: "WhatsApp Business",
    subtitle: "Aprovações via WhatsApp",
    description: "Envio automático de aprovações e respostas do cliente.",
    provider: "WHATSAPP_META_CLOUD",
    ownerKey: "AGENCY",
    kind: "whatsapp_business",
    scope: "agency",
    accentClass: "from-emerald-500 to-lime-500",
    icon: MessageCircle,
    dialogDescription:
      "Preencha os dados do WhatsApp Business Cloud API para envio.",
    oauth: {
      title: "Conexão oficial via Meta",
      subtitle: "Recomendado para webhooks e envio automático.",
      label: "Conectar via Meta",
      endpoint: "/integrations/whatsapp/connect-url",
    },
    fields: [
      {
        name: "wabaId",
        label: "WABA ID",
        placeholder: "104857600000000",
        required: true,
      },
      {
        name: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "106907000000000",
        required: true,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "EAAB...",
        required: true,
      },
      {
        name: "verifyToken",
        label: "Verify Token (webhook)",
        placeholder: "defina-um-token",
        required: false,
      },
    ],
  },
  {
    key: "tiktok",
    title: "TikTok",
    subtitle: "Publicações automáticas",
    description: "Publique vídeos e acompanhe a agenda do cliente.",
    provider: "TIKTOK",
    ownerKey: "TIKTOK",
    kind: "tiktok",
    scope: "client",
    accentClass: "from-fuchsia-500 to-rose-500",
    icon: Music,
    dialogDescription:
      "Informe as credenciais do aplicativo TikTok para postagem.",
    fields: [
      {
        name: "appId",
        label: "App ID",
        placeholder: "tt_app_id",
        required: true,
      },
      {
        name: "appSecret",
        label: "App Secret",
        type: "password",
        placeholder: "tt_secret",
        required: true,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "tiktok_access_token",
        required: true,
      },
      {
        name: "openId",
        label: "Open ID (opcional)",
        placeholder: "open_id",
        required: false,
      },
    ],
  },
  {
    key: "instagram",
    title: "Instagram",
    subtitle: "Somente Instagram",
    description: "Ideal quando o cliente quer postar apenas no Instagram.",
    provider: "META",
    ownerKey: "INSTAGRAM",
    kind: "instagram_only",
    scope: "client",
    accentClass: "from-pink-500 to-orange-500",
    icon: Camera,
    dialogDescription:
      "Conecte uma conta Instagram Business para publicar.",
    oauth: {
      title: "Conexão oficial via Meta",
      subtitle: "Use o login Meta para conectar o Instagram Business.",
      label: "Conectar via Meta",
      endpoint: "/integrations/meta/connect-url",
    },
    fields: [
      {
        name: "igBusinessId",
        label: "Instagram Business ID",
        placeholder: "17841400000000000",
        required: true,
      },
      {
        name: "pageId",
        label: "ID da Página do Facebook (opcional)",
        placeholder: "1234567890",
        required: false,
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "EAAB...",
        required: true,
      },
    ],
  },
];

function buildIntegrationKey(provider, ownerKey) {
  return `${provider}:${ownerKey || DEFAULT_OWNER_KEY}`;
}

function isConnectedStatus(status) {
  const value = String(status || "").toLowerCase();
  return value === "connected" || value === "active";
}

function resolveMetaKey(kind) {
  const normalized = String(kind || "").toLowerCase();
  if (normalized === "meta_ads") return "meta-ads";
  if (normalized === "instagram_only") return "instagram";
  return "meta-business";
}

export default function Integrations() {
  const [activeKey, setActiveKey] = useState(null);
  const [initialClientId, setInitialClientId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    data: integrations = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => base44.entities.Integration.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const integrationsByKey = useMemo(() => {
    const map = new Map();
    (integrations || []).forEach((integration) => {
      map.set(
        buildIntegrationKey(integration.provider, integration.ownerKey),
        integration
      );
    });
    return map;
  }, [integrations]);

  const connectedCount = useMemo(() => {
    return INTEGRATION_CATALOG.reduce((acc, item) => {
      if (item.scope === "client") {
        const matches = (integrations || []).filter(
          (integration) =>
            integration.ownerType === "CLIENT" &&
            integration.provider === item.provider &&
            (!item.kind || integration.settings?.kind === item.kind)
        );
        return acc + (matches.some((entry) => isConnectedStatus(entry.status)) ? 1 : 0);
      }
      const record = integrationsByKey.get(
        buildIntegrationKey(item.provider, item.ownerKey)
      );
      return acc + (isConnectedStatus(record?.status) ? 1 : 0);
    }, 0);
  }, [integrations, integrationsByKey]);

  const agencyIntegrations = useMemo(
    () => INTEGRATION_CATALOG.filter((item) => item.scope === "agency"),
    []
  );
  const clientIntegrations = useMemo(
    () => INTEGRATION_CATALOG.filter((item) => item.scope === "client"),
    []
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const agencyConnectedCount = useMemo(() => {
    return agencyIntegrations.reduce((acc, item) => {
      const record = integrationsByKey.get(
        buildIntegrationKey(item.provider, item.ownerKey)
      );
      return acc + (isConnectedStatus(record?.status) ? 1 : 0);
    }, 0);
  }, [agencyIntegrations, integrationsByKey]);

  const clientConnectedCount = useMemo(() => {
    if (!selectedClientId) return 0;
    return clientIntegrations.reduce((acc, item) => {
      const matches = (integrations || []).filter(
        (integration) =>
          integration.ownerType === "CLIENT" &&
          integration.clientId === selectedClientId &&
          integration.provider === item.provider &&
          (!item.kind || integration.settings?.kind === item.kind)
      );
      return acc + (matches.some((entry) => isConnectedStatus(entry.status)) ? 1 : 0);
    }, 0);
  }, [clientIntegrations, integrations, selectedClientId]);

  const activeDefinition = useMemo(() => {
    return INTEGRATION_CATALOG.find((item) => item.key === activeKey) || null;
  }, [activeKey]);

  const activeIntegration = useMemo(() => {
    if (!activeDefinition) return null;
    return (
      integrationsByKey.get(
        buildIntegrationKey(activeDefinition.provider, activeDefinition.ownerKey)
      ) || null
    );
  }, [activeDefinition, integrationsByKey]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const metaStatus = params.get("meta");
    if (params.get("whatsapp") === "connected" || metaStatus === "connected") {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }

    if (metaStatus === "connected") {
      const kind = params.get("kind");
      const clientId = params.get("clientId");
      setActiveKey(resolveMetaKey(kind));
      setInitialClientId(clientId || "");
    }
  }, [location.search, queryClient]);

  useEffect(() => {
    if (selectedClientId) return;
    if (clients.length === 1) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  const metaBanner = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const metaStatus = params.get("meta");
    if (!metaStatus) return null;
    if (metaStatus === "connected") {
      return {
        tone: "success",
        title: "Meta conectado com sucesso.",
        detail: "Selecione a conta principal antes de seguir.",
      };
    }
    if (metaStatus === "error") {
      return {
        tone: "error",
        title: "Não foi possível conectar a Meta.",
        detail: "Revise as permissões do app e tente novamente.",
      };
    }
    return null;
  }, [location.search]);

  return (
    <PageShell>
      <PageHeader
        title="Integracoes"
        subtitle="Conecte os canais essenciais da agencia e mantenha o fluxo automatizado."
        actions={
          <Button
            variant="secondary"
            leftIcon={RefreshCw}
            onClick={() => refetch()}
            disabled={isFetching}
            isLoading={isFetching}
          >
            Atualizar
          </Button>
        }
      />

      <div className="mt-2 text-xs text-[var(--text-muted)]">
        {connectedCount} de {INTEGRATION_CATALOG.length} integracoes conectadas.
      </div>

      <div className="mt-6 space-y-10">
        {metaBanner ? (
          <div
            className={`rounded-[12px] border px-4 py-3 text-sm ${
              metaBanner.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <p className="font-semibold">{metaBanner.title}</p>
            <p className="text-xs mt-1">{metaBanner.detail}</p>
          </div>
        ) : null}

        <section className="rounded-[24px] bg-white px-6 py-8 md:px-10 md:py-10 shadow-[var(--shadow-sm)] border border-[var(--border)]">
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Conexões da agência
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
              WhatsApp da agência
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              O WhatsApp é único para a agência e será usado para aprovações dos clientes.
            </p>
            <p className="text-xs text-slate-500">
              {agencyConnectedCount} de {agencyIntegrations.length} integrações conectadas.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1].map((item) => (
                <div
                  key={item}
                  className="h-56 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {agencyIntegrations.map((integration) => {
                const record =
                  integration.scope === "client"
                    ? null
                    : integrationsByKey.get(
                        buildIntegrationKey(integration.provider, integration.ownerKey)
                      );
                const tileStatus =
                  integration.scope === "client" ? "disconnected" : record?.status;
                const Icon = integration.icon;
                return (
                  <IntegrationTile
                    key={integration.key}
                    title={integration.title}
                    subtitle={integration.subtitle}
                    description={integration.description}
                    status={tileStatus}
                    accentClass={integration.accentClass}
                    icon={<Icon className="w-5 h-5 text-white" />}
                    actionLabel={
                      isConnectedStatus(tileStatus) ? "Gerenciar conexão" : "Conectar"
                    }
                    onConnect={() => {
                      setActiveKey(integration.key);
                      setInitialClientId("");
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[24px] bg-white px-6 py-8 md:px-10 md:py-10 shadow-[var(--shadow-sm)] border border-[var(--border)]">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Conexões do cliente
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Redes sociais por cliente
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Cada cliente precisa de suas próprias redes conectadas para posts e métricas.
              </p>
              <p className="text-xs text-slate-500">
                {selectedClientId
                  ? `${clientConnectedCount} de ${clientIntegrations.length} integrações conectadas`
                  : `Selecione um cliente para ver as integrações`}
              </p>
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <label className="text-xs font-semibold text-[var(--text-muted)]">
                Cliente selecionado
              </label>
              <select
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="w-full h-10 rounded-[10px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.2)]"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {clients.length === 0 ? (
                <p className="text-[11px] text-amber-600">
                  Cadastre um cliente antes de conectar redes sociais.
                </p>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-56 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {clientIntegrations.map((integration) => {
                const clientMatches = (integrations || []).filter(
                  (entry) =>
                    entry.ownerType === "CLIENT" &&
                    entry.clientId === selectedClientId &&
                    entry.provider === integration.provider &&
                    (!integration.kind || entry.settings?.kind === integration.kind)
                );
                const connectedClients = clientMatches.filter((entry) =>
                  isConnectedStatus(entry.status)
                );
                const tileStatus = connectedClients.length ? "connected" : "disconnected";
                const tileMeta =
                  selectedClient?.name && selectedClientId
                    ? `Cliente: ${selectedClient.name}`
                    : "Selecione um cliente para conectar";
                const Icon = integration.icon;
                return (
                  <IntegrationTile
                    key={integration.key}
                    title={integration.title}
                    subtitle={integration.subtitle}
                    description={integration.description}
                    status={tileStatus}
                    accentClass={integration.accentClass}
                    icon={<Icon className="w-5 h-5 text-white" />}
                    meta={tileMeta}
                    actionLabel={
                      isConnectedStatus(tileStatus) ? "Gerenciar conexão" : "Conectar"
                    }
                    disabled={!selectedClientId}
                    onConnect={() => {
                      if (!selectedClientId) return;
                      setActiveKey(integration.key);
                      setInitialClientId(selectedClientId);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        <IntegrationConnectDialog
          open={Boolean(activeDefinition)}
          onOpenChange={(openState) => {
            if (!openState) {
              setActiveKey(null);
              setInitialClientId("");
            }
          }}
          definition={activeDefinition}
          existing={activeIntegration}
          integrations={integrations}
          clients={clients}
          initialClientId={initialClientId}
        />
      </div>
    </PageShell>
  );
}
