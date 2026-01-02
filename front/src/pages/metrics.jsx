import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/apiClient/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import {
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  ChevronDown,
  Activity,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const METRIC_PROFILES = {
  meta_ads: {
    label: "Meta Ads",
    defaults: ["impressions", "clicks", "conversions", "spend"],
    metrics: [
      { key: "impressions", label: "Impressões", icon: Eye },
      { key: "clicks", label: "Cliques", icon: MousePointerClick },
      { key: "conversions", label: "Conversões", icon: Target },
      { key: "spend", label: "Investimento", icon: DollarSign },
      { key: "revenue", label: "Receita", icon: TrendingUp },
    ],
    chartLine: ["impressions", "clicks"],
    chartBar: ["spend", "conversions"],
  },
  google_ads: {
    label: "Google Ads",
    defaults: ["impressions", "clicks", "conversions", "spend"],
    metrics: [
      { key: "impressions", label: "Impressões", icon: Eye },
      { key: "clicks", label: "Cliques", icon: MousePointerClick },
      { key: "conversions", label: "Conversões", icon: Target },
      { key: "spend", label: "Investimento", icon: DollarSign },
      { key: "revenue", label: "Receita", icon: TrendingUp },
    ],
    chartLine: ["impressions", "clicks"],
    chartBar: ["spend", "conversions"],
  },
  google_analytics: {
    label: "Google Analytics",
    defaults: ["sessions", "users", "pageviews", "conversions"],
    metrics: [
      { key: "sessions", label: "Sessões", icon: Activity },
      { key: "users", label: "Usuários", icon: Users },
      { key: "pageviews", label: "Visualizações", icon: Eye },
      { key: "conversions", label: "Conversões", icon: Target },
      { key: "revenue", label: "Receita", icon: DollarSign },
    ],
    chartLine: ["sessions", "users"],
    chartBar: ["pageviews", "conversions"],
  },
};

const PROVIDER_BY_KIND = {
  meta_ads: "meta",
  google_ads: "google_ads",
  google_analytics: "google_analytics",
  tiktok_ads: "tiktok",
};

const RANGE_PRESETS = [
  { value: "7d", label: "Últimos 7 dias", days: 7 },
  { value: "30d", label: "Últimos 30 dias", days: 30 },
  { value: "90d", label: "Últimos 90 dias", days: 90 },
  { value: "custom", label: "Personalizado", days: null },
];

const CHART_COLORS = ["#6366F1", "#10B981", "#F97316", "#A855F7"];

function DropdownChip({ value, onChange, options, placeholder, className = "" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const currentLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-12 px-4 rounded-2xl border text-left text-sm font-semibold flex items-center justify-between transition ${
          open
            ? "border-purple-300 bg-purple-50 text-purple-700"
            : "border-slate-200 bg-white text-slate-700 hover:border-purple-200"
        }`}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl py-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-2 text-sm transition ${
                option.value === value
                  ? "text-purple-700 bg-purple-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDateInput(date) {
  if (!date) return "";
  if (typeof date === "string") return date;
  return new Date(date).toISOString().slice(0, 10);
}

export default function Metrics() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("all");
  const [periodPreset, setPeriodPreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [reportName, setReportName] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", selectedClient],
    queryFn: () =>
      base44.entities.Integration.list({
        clientId: selectedClient !== "all" ? selectedClient : undefined,
        status: "CONNECTED",
      }),
  });

  const clientMap = React.useMemo(() => {
    const map = new Map();
    clients.forEach((client) => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  const metricIntegrations = React.useMemo(() => {
    const allowedKinds = new Set([
      "meta_ads",
      "google_analytics",
      "google_ads",
      "tiktok_ads",
    ]);
    return (integrations || []).filter((integration) => {
      const kind = integration?.settings?.kind;
      return kind && allowedKinds.has(String(kind).toLowerCase());
    });
  }, [integrations]);

  const selectedIntegration = React.useMemo(() => {
    if (selectedIntegrationId === "all") return null;
    return metricIntegrations.find((item) => item.id === selectedIntegrationId) || null;
  }, [metricIntegrations, selectedIntegrationId]);

  const providerKind = React.useMemo(() => {
    const kindRaw = selectedIntegration?.settings?.kind;
    const normalized = kindRaw ? String(kindRaw).toLowerCase() : "";
    if (METRIC_PROFILES[normalized]) return normalized;
    if (selectedIntegration?.provider === "GOOGLE") return "google_analytics";
    if (selectedIntegration?.provider === "META") return "meta_ads";
    return "meta_ads";
  }, [selectedIntegration]);

  const profile = METRIC_PROFILES[providerKind] || METRIC_PROFILES.meta_ads;
  const availableMetrics = profile.metrics || [];

  useEffect(() => {
    setSelectedMetrics(profile.defaults || []);
  }, [providerKind]);

  useEffect(() => {
    if (periodPreset !== "custom") return;
    if (!customFrom || !customTo) {
      const preset = RANGE_PRESETS.find((p) => p.value === "30d");
      const to = new Date();
      const from = new Date(to.getTime() - (preset?.days || 30) * 24 * 60 * 60 * 1000);
      setCustomFrom(formatDateInput(from));
      setCustomTo(formatDateInput(to));
    }
  }, [periodPreset, customFrom, customTo]);

  useEffect(() => {
    if (selectedClient === "all") return;
    if (metricIntegrations.length === 1) {
      setSelectedIntegrationId(metricIntegrations[0].id);
      return;
    }
    if (
      selectedIntegrationId !== "all" &&
      !metricIntegrations.find((item) => item.id === selectedIntegrationId)
    ) {
      setSelectedIntegrationId("all");
    }
  }, [metricIntegrations, selectedClient, selectedIntegrationId]);

  const activeMetrics = selectedMetrics.length
    ? selectedMetrics
    : profile.defaults || [];

  const providerFilter = selectedIntegration
    ? PROVIDER_BY_KIND[providerKind]
    : null;

  const rangeConfig = React.useMemo(() => {
    if (periodPreset === "custom") {
      const startDate = customFrom ? new Date(customFrom) : null;
      const endDate = customTo ? new Date(customTo) : null;
      return {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        rangeFrom: customFrom || undefined,
        rangeTo: customTo || undefined,
        rangeDays: undefined,
      };
    }

    const preset = RANGE_PRESETS.find((p) => p.value === periodPreset) || RANGE_PRESETS[1];
    const to = new Date();
    const from = new Date(to.getTime() - preset.days * 24 * 60 * 60 * 1000);

    return {
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      rangeFrom: formatDateInput(from),
      rangeTo: formatDateInput(to),
      rangeDays: preset.days,
    };
  }, [periodPreset, customFrom, customTo]);

  const filters = React.useMemo(() => {
    const data = {};
    if (selectedClient !== "all") data.clientId = selectedClient;
    if (selectedIntegrationId !== "all") data.integrationId = selectedIntegrationId;
    if (providerFilter) data.provider = providerFilter;
    return data;
  }, [selectedClient, selectedIntegrationId, providerFilter]);

  const { data: aggregateData = { buckets: [] }, isLoading: loadingAggregate } = useQuery({
    queryKey: ["metrics-aggregate", filters, activeMetrics, rangeConfig.startDate, rangeConfig.endDate],
    queryFn: () => {
      const body = {
        groupBy: "day",
        metricTypes: activeMetrics,
        startDate: rangeConfig.startDate,
        endDate: rangeConfig.endDate,
      };
      if (filters.clientId) body.clientId = filters.clientId;
      if (filters.integrationId) body.integrationId = filters.integrationId;
      if (filters.provider) body.provider = filters.provider;

      return base44.jsonFetch("/metrics/aggregate", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    enabled: activeMetrics.length > 0,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["metrics-summary", filters, activeMetrics],
    queryFn: () => {
      const params = new URLSearchParams();
      if (rangeConfig.rangeDays) params.set("days", String(rangeConfig.rangeDays));
      if (rangeConfig.startDate) params.set("startDate", rangeConfig.startDate);
      if (rangeConfig.endDate) params.set("endDate", rangeConfig.endDate);
      if (activeMetrics.length) {
        params.set("metricTypes", activeMetrics.join(","));
      }
      if (filters.clientId) params.set("clientId", filters.clientId);
      if (filters.integrationId) params.set("integrationId", filters.integrationId);
      if (filters.provider) params.set("provider", filters.provider);
      return base44.jsonFetch(`/metrics/summary/quick?${params.toString()}`);
    },
    enabled: activeMetrics.length > 0,
  });

  const totals = React.useMemo(() => {
    const allKeys = profile.metrics.map((metric) => metric.key);
    return allKeys.reduce((acc, key) => {
      acc[key] = summaryData?.totals?.[key] ? Number(summaryData.totals[key]) : 0;
      return acc;
    }, {});
  }, [summaryData, profile.metrics]);

  const adsCtr =
    totals.impressions > 0
      ? (totals.clicks / totals.impressions) * 100
      : 0;
  const adsCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const adsRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const gaConversionRate = totals.sessions > 0 ? (totals.conversions / totals.sessions) * 100 : 0;
  const gaSessionsPerUser = totals.users > 0 ? totals.sessions / totals.users : 0;
  const gaRevenuePerSession = totals.sessions > 0 ? totals.revenue / totals.sessions : 0;

  const chartMetrics = Array.isArray(aggregateData?.buckets)
    ? aggregateData.buckets.slice(-14).map((bucket) => {
        const dateLabel = new Date(bucket.period).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const entry = { date: dateLabel };
        activeMetrics.forEach((metricKey) => {
          entry[metricKey] = bucket.metrics?.[metricKey] || 0;
        });
        return entry;
      })
    : [];

  const lineKeys = (profile.chartLine || []).filter((key) => activeMetrics.includes(key));
  const barKeys = (profile.chartBar || []).filter((key) => activeMetrics.includes(key));
  const lineSeries = lineKeys.length ? lineKeys : activeMetrics.slice(0, 2);
  const barSeries = barKeys.length ? barKeys : activeMetrics.slice(0, 2);

  const metricMetaMap = React.useMemo(() => {
    const map = new Map();
    profile.metrics.forEach((metric) => {
      map.set(metric.key, metric);
    });
    return map;
  }, [profile.metrics]);

  const stats = (profile.defaults || []).slice(0, 4).map((key) => {
    const meta = metricMetaMap.get(key);
    const Icon = meta?.icon || TrendingUp;
    const value = key === "spend" || key === "revenue" ? formatCurrency(totals[key]) : formatNumber(totals[key]);
    return {
      key,
      title: meta?.label || key,
      value,
      icon: Icon,
      color: "from-purple-400 to-purple-500",
    };
  });

  const kpiCards = providerKind === "google_analytics"
    ? [
        {
          label: "Taxa de conversão",
          value: formatPercent(gaConversionRate),
          color: "from-blue-50 to-blue-100",
          text: "text-blue-900",
          border: "border-blue-200",
        },
        {
          label: "Sessões por usuário",
          value: gaSessionsPerUser.toFixed(2),
          color: "from-green-50 to-green-100",
          text: "text-green-900",
          border: "border-green-200",
        },
        {
          label: "Receita por sessão",
          value: formatCurrency(gaRevenuePerSession),
          color: "from-purple-50 to-purple-100",
          text: "text-purple-900",
          border: "border-purple-200",
        },
      ]
    : [
        {
          label: "CTR Médio",
          value: formatPercent(adsCtr),
          color: "from-purple-50 to-purple-100",
          text: "text-purple-900",
          border: "border-purple-200",
        },
        {
          label: "CPC Médio",
          value: formatCurrency(adsCpc),
          color: "from-blue-50 to-blue-100",
          text: "text-blue-900",
          border: "border-blue-200",
        },
        {
          label: "ROAS",
          value: `${adsRoas.toFixed(2)}x`,
          color: "from-green-50 to-green-100",
          text: "text-green-900",
          border: "border-green-200",
        },
      ];

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration) {
        throw new Error("Selecione uma integração para sincronizar métricas.");
      }
      return base44.jsonFetch("/metrics/sync", {
        method: "POST",
        body: JSON.stringify({
          integrationId: selectedIntegration.id,
          clientId: selectedClient !== "all" ? selectedClient : selectedIntegration.clientId,
          metricTypes: activeMetrics,
          rangeFrom: rangeConfig.rangeFrom,
          rangeTo: rangeConfig.rangeTo,
          rangeDays: rangeConfig.rangeDays,
        }),
      });
    },
    onSuccess: () => {
      setActionError("");
      setActionMessage("Sincronização enfileirada. Em alguns minutos os dados aparecem.");
      queryClient.invalidateQueries({ queryKey: ["metrics-aggregate"] });
      queryClient.invalidateQueries({ queryKey: ["metrics-summary"] });
    },
    onError: (err) => {
      setActionMessage("");
      setActionError(err?.message || "Falha ao sincronizar métricas.");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration) {
        throw new Error("Selecione uma integração para gerar o relatório.");
      }
      return base44.jsonFetch("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          name: reportName || `Relatório ${profile.label}`,
          type: `${providerKind}_report`,
          clientId: selectedClient !== "all" ? selectedClient : selectedIntegration.clientId,
          integrationId: selectedIntegration.id,
          provider: providerFilter,
          metricTypes: activeMetrics,
          rangeFrom: rangeConfig.rangeFrom,
          rangeTo: rangeConfig.rangeTo,
          rangeDays: rangeConfig.rangeDays,
          sendWhatsApp: sendWhatsapp,
        }),
      });
    },
    onSuccess: () => {
      setActionError("");
      setActionMessage(
        sendWhatsapp
          ? "Relatório enfileirado. Você receberá a confirmação por WhatsApp."
          : "Relatório enfileirado. Em breve ele ficará disponível nos relatórios."
      );
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => {
      setActionMessage("");
      setActionError(err?.message || "Falha ao gerar relatório.");
    },
  });

  const integrationOptions = React.useMemo(() => {
    if (!metricIntegrations.length) return [];
    return metricIntegrations.map((integration) => {
      const kind = integration?.settings?.kind
        ? String(integration.settings.kind).toLowerCase()
        : null;
      const label = METRIC_PROFILES[kind]?.label || integration.providerName || integration.provider;
      const clientName = selectedClient === "all" ? clientMap.get(integration.clientId)?.name : null;
      return {
        value: integration.id,
        label: clientName ? `${label} • ${clientName}` : label,
      };
    });
  }, [metricIntegrations, clientMap, selectedClient]);

  return (
    <PageShell>
      <PageHeader
        title="Métricas"
        subtitle="Selecione o cliente, a integracao e as metricas para gerar relatorios completos."
      />

      <div className="mt-6">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Configurar métricas e relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Cliente</Label>
                <DropdownChip
                  value={selectedClient}
                  onChange={setSelectedClient}
                  placeholder="Todos os clientes"
                  options={[
                    { value: "all", label: "Todos os clientes" },
                    ...clients.map((client) => ({
                      value: client.id,
                      label: client.name,
                    })),
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600">Integração</Label>
                <DropdownChip
                  value={selectedIntegrationId}
                  onChange={setSelectedIntegrationId}
                  placeholder="Selecione a integração"
                  options={[
                    { value: "all", label: "Todas as integrações" },
                    ...integrationOptions,
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600">Período</Label>
                <DropdownChip
                  value={periodPreset}
                  onChange={setPeriodPreset}
                  placeholder="Selecione o período"
                  options={RANGE_PRESETS.map((preset) => ({
                    value: preset.value,
                    label: preset.label,
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            {periodPreset === "custom" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Data inicial</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Data final</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
              <div>
                <Label className="text-sm text-gray-600">Métricas</Label>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableMetrics.map((metric) => (
                    <label
                      key={metric.key}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <Checkbox
                        checked={selectedMetrics.includes(metric.key)}
                        onCheckedChange={(checked) => {
                          setSelectedMetrics((prev) => {
                            if (checked) return Array.from(new Set([...prev, metric.key]));
                            const next = prev.filter((item) => item !== metric.key);
                            return next.length ? next : prev;
                          });
                        }}
                      />
                      <span>{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Nome do relatório</Label>
                  <Input
                    value={reportName}
                    onChange={(event) => setReportName(event.target.value)}
                    placeholder={`Relatório ${profile.label}`}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={sendWhatsapp}
                    onCheckedChange={setSendWhatsapp}
                  />
                  Enviar relatório no WhatsApp do cliente
                </label>

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? "Sincronizando..." : "Sincronizar métricas"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-slate-900 hover:bg-slate-800"
                    onClick={() => reportMutation.mutate()}
                    disabled={reportMutation.isPending}
                  >
                    {reportMutation.isPending ? "Gerando relatório..." : "Gerar relatório"}
                  </Button>
                </div>

                {actionMessage && (
                  <p className="text-sm text-green-600">{actionMessage}</p>
                )}
                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.key}
                className="relative overflow-hidden border border-purple-100"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}
                />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-5 h-5 text-purple-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <Card className="border border-purple-100">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">
                {profile.label}: evolução diária
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    {lineSeries.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={metricMetaMap.get(key)?.label || key}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Sem dados suficientes para exibir o gráfico
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-purple-100">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Comparativo das métricas principais
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    {barSeries.map((key, index) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        name={metricMetaMap.get(key)?.label || key}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Sem dados suficientes para exibir o gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.label}
              className={`bg-gradient-to-br ${kpi.color} border ${kpi.border}`}
            >
              <CardHeader>
                <CardTitle className={kpi.text}>{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${kpi.text}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {aggregateData?.buckets?.length === 0 && !loadingAggregate && (
          <Card className="border border-dashed border-purple-200 mt-4">
            <CardContent className="py-16 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma métrica ainda
              </h3>
              <p className="text-gray-600">
                As métricas aparecerão aqui quando as integrações estiverem
                ativas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
