import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import FilterBar from "@/components/ui/filter-bar.jsx";
import EmptyState from "@/components/ui/empty-state.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";
import { SelectNative } from "@/components/ui/select-native.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DateField } from "@/components/ui/date-field.jsx";
import StatPill from "@/components/ui/stat-pill.jsx";
import Toast from "@/components/ui/toast.jsx";
import useToast from "@/hooks/useToast.js";
import { useActiveClient } from "@/hooks/useActiveClient.js";
import CompetitorFormDialog from "@/components/competitors/CompetitorFormDialog.jsx";
import {
  ArrowUpRight,
  BarChart3,
  Heart,
  MessageCircle,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function toDateKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return "Sem coleta";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem coleta";
  return date.toLocaleDateString("pt-BR");
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function normalizeMetric(value) {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDelta(value, formatter) {
  if (value === undefined || value === null) return "--";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "--";
  const sign = parsed > 0 ? "+" : "";
  if (typeof formatter === "function") return `${sign}${formatter(parsed)}`;
  return `${sign}${parsed}`;
}

function deltaClass(value) {
  if (value === undefined || value === null) return "text-[var(--text-muted)]";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "text-[var(--text-muted)]";
  if (parsed > 0) return "text-[var(--accent-teal)]";
  if (parsed < 0) return "text-[var(--accent-rose)]";
  return "text-[var(--text-muted)]";
}

function buildTimelineSeries(items, metricKey) {
  const buckets = new Map();
  (items || []).forEach((item) => {
    (item.snapshots || []).forEach((snapshot) => {
      const key = toDateKey(snapshot.collectedAt);
      if (!key) return;
      if (!buckets.has(key)) buckets.set(key, { date: key });
      buckets.get(key)[item.id] = normalizeMetric(snapshot[metricKey]);
    });
  });
  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function resolveStatusVariant(status) {
  if (status === "ACTIVE") return "success";
  if (status === "INACTIVE") return "warning";
  return "default";
}

export default function Competitors() {
  const [activeClientId, setActiveClientId] = useActiveClient();
  const [selectedClientId, setSelectedClientId] = React.useState(activeClientId || "");
  const [platform, setPlatform] = React.useState("instagram");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [startDate, setStartDate] = React.useState(() => {
    const today = new Date();
    const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return toDateKey(from);
  });
  const [endDate, setEndDate] = React.useState(() => toDateKey(new Date()));
  const [selectedCompetitorId, setSelectedCompetitorId] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCompetitor, setEditingCompetitor] = React.useState(null);
  const queryClient = useQueryClient();
  const { toast, showToast } = useToast();

  React.useEffect(() => {
    if (activeClientId === selectedClientId) return;
    setSelectedClientId(activeClientId || "");
  }, [activeClientId, selectedClientId]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const listFilters = React.useMemo(() => {
    const trimmed = searchTerm.trim();
    return {
      clientId: selectedClientId || undefined,
      platform: platform || undefined,
      q: trimmed || undefined,
    };
  }, [selectedClientId, platform, searchTerm]);

  const competitorsQuery = useQuery({
    queryKey: ["competitors", listFilters],
    queryFn: () => base44.entities.Competitor.list(listFilters),
  });

  const competitors = Array.isArray(competitorsQuery.data)
    ? competitorsQuery.data
    : [];

  React.useEffect(() => {
    if (!competitors.length) {
      setSelectedCompetitorId(null);
      return;
    }
    if (!selectedCompetitorId) {
      setSelectedCompetitorId(competitors[0].id);
      return;
    }
    const stillExists = competitors.some((item) => item.id === selectedCompetitorId);
    if (!stillExists) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId]);

  const selectedCompetitor = competitors.find(
    (item) => item.id === selectedCompetitorId
  );

  const compareFilters = React.useMemo(() => {
    const trimmed = searchTerm.trim();
    return {
      clientId: selectedClientId || undefined,
      platform: platform || undefined,
      q: trimmed || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 12,
      perCompetitor: 60,
    };
  }, [selectedClientId, platform, searchTerm, startDate, endDate]);

  const comparisonEnabled = Boolean(startDate && endDate);
  const comparisonQuery = useQuery({
    queryKey: ["competitors-compare", compareFilters],
    queryFn: () => base44.entities.Competitor.compare(compareFilters),
    enabled: comparisonEnabled,
  });

  const comparisonItems =
    comparisonEnabled && Array.isArray(comparisonQuery.data?.items)
      ? comparisonQuery.data.items
      : [];

  const comparisonRows = React.useMemo(
    () =>
      comparisonItems.map((item) => ({
        id: item.id,
        name: item.name || `@${item.username}`,
        username: item.username,
        status: item.status,
        latestSnapshot: item.latestSnapshot,
        firstSnapshot: item.firstSnapshot,
        deltas: item.deltas || {},
        followers: normalizeMetric(item.latestSnapshot?.followers),
        engagementRate: normalizeMetric(item.latestSnapshot?.engagementRate),
        interactions: normalizeMetric(item.latestSnapshot?.interactions),
        postsCount: normalizeMetric(item.latestSnapshot?.postsCount),
        followersDelta: normalizeMetric(item.deltas?.followers),
        engagementDelta: normalizeMetric(item.deltas?.engagementRate),
        interactionsDelta: normalizeMetric(item.deltas?.interactions),
        postsDelta: normalizeMetric(item.deltas?.postsCount),
        collectedAt: item.latestSnapshot?.collectedAt,
      })),
    [comparisonItems]
  );

  const followersSeries = React.useMemo(
    () => buildTimelineSeries(comparisonItems, "followers"),
    [comparisonItems]
  );

  const seriesMeta = React.useMemo(
    () =>
      comparisonItems.map((item, index) => ({
        id: item.id,
        label: item.name || `@${item.username}`,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [comparisonItems]
  );

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Competitor.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitors-compare"] });
      setDialogOpen(false);
      setEditingCompetitor(null);
    },
    onError: (error) => {
      showToast(error?.message || "Erro ao criar concorrente.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Competitor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitors-compare"] });
      setDialogOpen(false);
      setEditingCompetitor(null);
    },
    onError: (error) => {
      showToast(error?.message || "Erro ao atualizar concorrente.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Competitor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitors-compare"] });
    },
    onError: (error) => {
      showToast(error?.message || "Erro ao remover concorrente.", "error");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id) => base44.entities.Competitor.sync(id),
    onSuccess: (response) => {
      showToast(response?.message || "Solicitacao enviada com sucesso.", "info");
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitors-compare"] });
    },
    onError: (error) => {
      showToast(error?.message || "Erro ao solicitar atualizacao.", "error");
    },
  });

  const handleSubmit = (payload) => {
    if (editingCompetitor?.id) {
      updateMutation.mutate({ id: editingCompetitor.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (competitor) => {
    setEditingCompetitor(competitor);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCompetitor(null);
    setDialogOpen(true);
  };

  const handleRemove = (competitorId) => {
    if (!competitorId) return;
    if (!window.confirm("Deseja remover este concorrente?")) return;
    deleteMutation.mutate(competitorId);
  };

  const listEmpty = !competitorsQuery.isLoading && competitors.length === 0;
  const comparisonEmpty =
    comparisonEnabled &&
    comparisonQuery.isFetched &&
    !comparisonQuery.isLoading &&
    comparisonItems.length === 0;

  return (
    <PageShell>
      <PageHeader
        title="Concorrentes"
        subtitle="Compare desempenho e monitore o mercado por rede."
        actions={
          <Button leftIcon={UsersRound} onClick={handleAdd}>
            Adicionar concorrente
          </Button>
        }
      />

      <FilterBar className="mt-6">
        <div className="min-w-[220px] flex-1">
          <Label>Cliente</Label>
          <SelectNative
            value={selectedClientId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedClientId(value);
              setActiveClientId(value);
            }}
          >
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </SelectNative>
        </div>

        <div className="min-w-[180px]">
          <Label>Rede</Label>
          <SelectNative
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectNative>
        </div>

        <div className="min-w-[240px] flex-1">
          <Label>Busca</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar concorrente"
              className="pl-9"
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <Label>Inicio</Label>
          <DateField value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>

        <div className="min-w-[160px]">
          <Label>Fim</Label>
          <DateField value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              competitorsQuery.refetch();
              comparisonQuery.refetch();
            }}
            disabled={competitorsQuery.isFetching || comparisonQuery.isFetching}
          >
            Atualizar comparativo
          </Button>
        </div>
      </FilterBar>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Panorama competitivo</CardTitle>
                <p className="text-sm text-[var(--text-muted)]">
                  {competitors.length} concorrente(s) monitorados
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={() => {
                  if (selectedCompetitor?.id) {
                    syncMutation.mutate(selectedCompetitor.id);
                  } else {
                    showToast("Selecione um concorrente para atualizar.", "info");
                  }
                }}
                disabled={!selectedCompetitor?.id || syncMutation.isPending}
              >
                Atualizar dados
              </Button>
            </div>
            {selectedCompetitor?.metadata?.lastSyncRequestedAt ? (
              <p className="text-xs text-[var(--text-muted)]">
                Ultima solicitacao:{" "}
                {formatDate(selectedCompetitor.metadata.lastSyncRequestedAt)}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {competitorsQuery.isLoading ? (
              <EmptyState
                title="Carregando concorrentes"
                description="Estamos reunindo os dados de monitoramento."
                action={
                  <Button variant="ghost" onClick={() => competitorsQuery.refetch()}>
                    Atualizar agora
                  </Button>
                }
              />
            ) : listEmpty ? (
              <EmptyState
                title="Sem concorrentes monitorados"
                description="Adicione concorrentes para comparar performance e capturar oportunidades."
                action={
                  <Button leftIcon={UsersRound} onClick={handleAdd}>
                    Adicionar concorrente
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {competitors.map((competitor) => {
                  const snapshot = competitor.latestSnapshot || null;
                  const status = competitor.status || "ACTIVE";
                  return (
                    <button
                      key={competitor.id}
                      type="button"
                      onClick={() => setSelectedCompetitorId(competitor.id)}
                      className={`w-full text-left transition ${
                        competitor.id === selectedCompetitorId
                          ? "bg-[var(--surface-muted)]"
                          : "hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-4 px-4 py-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-light)] text-sm font-semibold text-[var(--primary)]">
                            {(competitor.name || competitor.username || "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">
                              {competitor.name || `@${competitor.username}`}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              @{competitor.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <StatPill
                            label="Status"
                            value={status === "ACTIVE" ? "Ativo" : status}
                            variant={resolveStatusVariant(status)}
                          />
                          {snapshot ? (
                            <StatPill
                              label="Seguidores"
                              value={formatNumber(snapshot.followers)}
                              variant="default"
                            />
                          ) : (
                            <StatPill
                              label="Seguidores"
                              value="--"
                              variant="default"
                            />
                          )}
                        </div>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(competitor);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemove(competitor.id);
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
                        <div className="rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-xs">
                          <p className="text-[var(--text-muted)]">Engajamento</p>
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {snapshot ? formatPercent(snapshot.engagementRate) : "--"}
                          </p>
                        </div>
                        <div className="rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-xs">
                          <p className="text-[var(--text-muted)]">Posts</p>
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {snapshot ? formatNumber(snapshot.postsCount) : "--"}
                          </p>
                        </div>
                        <div className="rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-xs">
                          <p className="text-[var(--text-muted)]">Ultima coleta</p>
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {snapshot ? formatDate(snapshot.collectedAt) : "Pendente"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do concorrente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCompetitor ? (
              <>
                <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-semibold text-[var(--primary)]">
                      {(selectedCompetitor.name || selectedCompetitor.username || "?")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {selectedCompetitor.name || `@${selectedCompetitor.username}`}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        @{selectedCompetitor.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Users className="h-4 w-4" />
                    {selectedCompetitor.latestSnapshot
                      ? `${formatNumber(selectedCompetitor.latestSnapshot.followers)} seguidores`
                      : "Aguardando dados de seguidores"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-3">
                    <p className="text-xs text-[var(--text-muted)]">Engajamento</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {selectedCompetitor.latestSnapshot
                        ? formatPercent(selectedCompetitor.latestSnapshot.engagementRate)
                        : "--"}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-3">
                    <p className="text-xs text-[var(--text-muted)]">Posts</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {selectedCompetitor.latestSnapshot
                        ? formatNumber(selectedCompetitor.latestSnapshot.postsCount)
                        : "--"}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-3">
                    <p className="text-xs text-[var(--text-muted)]">Interacoes</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {selectedCompetitor.latestSnapshot
                        ? formatNumber(selectedCompetitor.latestSnapshot.interactions)
                        : "--"}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-3">
                    <p className="text-xs text-[var(--text-muted)]">Ultima coleta</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                      {selectedCompetitor.latestSnapshot
                        ? formatDate(selectedCompetitor.latestSnapshot.collectedAt)
                        : "Pendente"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[14px] border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                        <Users className="h-4 w-4 text-[var(--text-muted)]" />
                        Top posts
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        Em breve
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={`placeholder-post-${item}`}
                          className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[var(--text)]">
                              Post #{item}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              Sem dados de performance
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              --
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              --
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                        <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
                        Evolucao diaria
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        Em breve
                      </span>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {[32, 48, 24, 56, 40, 28, 52].map((height, index) => (
                        <div
                          key={`bar-${index}`}
                          className="flex-1 rounded-[6px] bg-[var(--surface-muted)]"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      Ative a integracao Meta para visualizar a evolucao diaria.
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  leftIcon={ArrowUpRight}
                  onClick={() => syncMutation.mutate(selectedCompetitor.id)}
                  disabled={syncMutation.isPending}
                >
                  Solicitar atualizacao
                </Button>
              </>
            ) : (
              <EmptyState
                title="Selecione um concorrente"
                description="Escolha um nome na lista para abrir o resumo completo."
                icon={UserRound}
                action={
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (competitors[0]?.id) {
                        setSelectedCompetitorId(competitors[0].id);
                      }
                    }}
                  >
                    Selecionar primeiro da lista
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Comparativo do periodo</CardTitle>
              <p className="text-sm text-[var(--text-muted)]">
                Analise o desempenho agregado no periodo selecionado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatPill
                label="Periodo"
                value={
                  startDate && endDate
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : "Sem filtro"
                }
                variant="default"
              />
              <StatPill
                label="Concorrentes"
                value={comparisonItems.length}
                variant="default"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!comparisonEnabled ? (
            <EmptyState
              title="Defina um periodo"
              description="Escolha um intervalo para calcular o comparativo."
            />
          ) : comparisonQuery.isLoading ? (
            <EmptyState
              title="Carregando comparativo"
              description="Estamos reunindo os dados do periodo."
            />
          ) : comparisonEmpty ? (
            <EmptyState
              title="Sem dados para comparar"
              description="Cadastre concorrentes e aguarde a coleta para visualizar os graficos."
              action={
                <Button leftIcon={UsersRound} onClick={handleAdd}>
                  Adicionar concorrente
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="rounded-[16px] border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" />
                    Crescimento de seguidores
                  </div>
                  <div className="mt-4 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={followersSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-muted)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatShortDate(value)}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => formatNumber(value)}
                          labelFormatter={(value) => formatDate(value)}
                        />
                        <Legend />
                        {seriesMeta.map((series) => (
                          <Line
                            key={series.id}
                            type="monotone"
                            dataKey={series.id}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[16px] border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
                    Crescimento de seguidores no periodo
                  </div>
                  <div className="mt-4 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonRows} margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-muted)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => formatNumber(value)}
                          labelFormatter={(value) => value}
                        />
                        <Bar
                          dataKey="followersDelta"
                          name="Delta seguidores"
                          fill="var(--chart-2)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Delta calculado entre a primeira e a ultima coleta do periodo.
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
                  Tabela comparativa
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-3 py-2">Concorrente</th>
                        <th className="px-3 py-2">Seguidores</th>
                        <th className="px-3 py-2">Delta</th>
                        <th className="px-3 py-2">Engajamento</th>
                        <th className="px-3 py-2">Delta</th>
                        <th className="px-3 py-2">Interacoes</th>
                        <th className="px-3 py-2">Delta</th>
                        <th className="px-3 py-2">Posts</th>
                        <th className="px-3 py-2">Ultima coleta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.id}
                          className={
                            row.id === selectedCompetitorId
                              ? "bg-[var(--surface-muted)]"
                              : ""
                          }
                        >
                          <td className="px-3 py-3">
                            <div className="text-sm font-semibold text-[var(--text)]">
                              {row.name}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                              @{row.username}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {row.followers !== null ? formatNumber(row.followers) : "--"}
                          </td>
                          <td className={`px-3 py-3 font-semibold ${deltaClass(row.followersDelta)}`}>
                            {formatDelta(row.followersDelta, (value) => formatNumber(value))}
                          </td>
                          <td className="px-3 py-3">
                            {row.engagementRate !== null
                              ? formatPercent(row.engagementRate)
                              : "--"}
                          </td>
                          <td className={`px-3 py-3 font-semibold ${deltaClass(row.engagementDelta)}`}>
                            {formatDelta(row.engagementDelta, (value) =>
                              `${value.toFixed(2)}%`
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {row.interactions !== null
                              ? formatNumber(row.interactions)
                              : "--"}
                          </td>
                          <td className={`px-3 py-3 font-semibold ${deltaClass(row.interactionsDelta)}`}>
                            {formatDelta(row.interactionsDelta, (value) => formatNumber(value))}
                          </td>
                          <td className="px-3 py-3">
                            {row.postsCount !== null ? formatNumber(row.postsCount) : "--"}
                          </td>
                          <td className="px-3 py-3 text-xs text-[var(--text-muted)]">
                            {row.collectedAt ? formatDate(row.collectedAt) : "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CompetitorFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingCompetitor(null);
        }}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
        clients={clients}
        defaultClientId={selectedClientId}
        competitor={editingCompetitor}
      />

      <Toast toast={toast} />
    </PageShell>
  );
}
