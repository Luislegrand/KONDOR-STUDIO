import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  LayoutGrid,
  MessageCircle,
  ThumbsUp,
  XCircle,
} from "lucide-react";

import { base44 } from "@/apiClient/base44Client";
import logoHeader from "@/assets/logoheader.png";
import { resolveMediaUrl } from "@/lib/media.js";

async function fetchClient(path, token, options = {}) {
  const res = await base44.rawFetch(path, {
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const msg =
      data?.error ||
      (res.status === 401
        ? "Sessão expirada. Faça login novamente."
        : "Erro ao carregar dados do portal.");
    throw new Error(msg);
  }

  return data;
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const [clientToken, setClientToken] = useState(null);
  const [authError, setAuthError] = useState("");
  const [activePage, setActivePage] = useState("posts");
  const queryClient = useQueryClient();

  useEffect(() => {
    const raw =
      (typeof window !== "undefined" &&
        (window.localStorage.getItem("kondor_client_auth") ||
          window.localStorage.getItem("kondor_client_token"))) ||
      null;

    if (!raw) return navigate("/clientlogin");

    let token = null;
    try {
      if (raw.trim().startsWith("{")) {
        const parsed = JSON.parse(raw);
        token =
          parsed.accessToken ||
          parsed.token ||
          parsed.clientToken ||
          parsed.jwt ||
          null;
      } else {
        token = raw;
      }
    } catch (err) {
      console.error("Erro ao ler token do cliente:", err);
      return navigate("/clientlogin");
    }

    if (!token) return navigate("/clientlogin");
    setClientToken(token);
  }, [navigate]);

  const queriesEnabled = !!clientToken;

  const {
    data: meData,
    isLoading: loadingMe,
    error: meError,
  } = useQuery({
    queryKey: ["client-portal", "me"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/client-portal/me", clientToken),
  });

  useEffect(() => {
    if (meError) {
      setAuthError(meError.message || "Erro ao carregar dados do cliente");
    }
  }, [meError]);

  const client = meData?.client || null;

  const primaryColor =
    client?.metadata?.primary_color ||
    client?.metadata?.agency_primary_color ||
    "#A78BFA";
  const accentColor =
    client?.metadata?.accent_color ||
    client?.metadata?.agency_accent_color ||
    "#39FF14";

  useEffect(() => {
    if (client) {
      document.documentElement.style.setProperty(
        "--primary",
        primaryColor || "#A78BFA"
      );
      document.documentElement.style.setProperty(
        "--accent",
        accentColor || "#39FF14"
      );
    }
  }, [client, primaryColor, accentColor]);

  const {
    data: postsData,
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ["client-portal", "posts"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/client-portal/posts", clientToken),
  });

  const posts = postsData?.items || [];

  const {
    data: metricsData,
    isLoading: loadingMetrics,
    error: metricsError,
  } = useQuery({
    queryKey: ["client-portal", "metrics"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/client-portal/metrics", clientToken),
  });

  const metrics = metricsData?.items || [];


  const {
    data: approvalsData,
    isLoading: loadingApprovals,
  } = useQuery({
    queryKey: ["client-portal", "approvals", "PENDING"],
    enabled: queriesEnabled,
    queryFn: () =>
      fetchClient("/client-portal/approvals?status=PENDING", clientToken),
  });

  const approvals = approvalsData?.items || [];
  const refreshPortalData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["client-portal", "posts"] });
    queryClient.invalidateQueries({
      queryKey: ["client-portal", "approvals", "PENDING"],
    });
  }, [queryClient]);

  const approveClientApproval = useCallback(
    (approvalId, payload) =>
      fetchClient(
        `/client-portal/approvals/${approvalId}/approve`,
        clientToken,
        {
          method: "POST",
          body: JSON.stringify(payload || {}),
        },
      ),
    [clientToken],
  );

  const rejectClientApproval = useCallback(
    (approvalId, payload) =>
      fetchClient(
        `/client-portal/approvals/${approvalId}/reject`,
        clientToken,
        {
          method: "POST",
          body: JSON.stringify(payload || {}),
        },
      ),
    [clientToken],
  );

  const approvalsByPostId = useMemo(() => {
    const map = new Map();
    approvals.forEach((approval) => {
      const postId = approval.postId || approval.post?.id;
      if (!postId) return;
      const existing = map.get(postId);
      if (!existing) return map.set(postId, approval);

      const d1 = existing.createdAt ? new Date(existing.createdAt) : null;
      const d2 = approval.createdAt ? new Date(approval.createdAt) : null;
      if (!d1 || (d2 && d2 > d1)) map.set(postId, approval);
    });
    return map;
  }, [approvals]);

  const pendingPosts = posts.filter((p) => approvalsByPostId.has(p.id));
  const approvedPosts = posts.filter((p) =>
    ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(p.status)
  );
  const awaitingCorrection = posts.filter(
    (p) => p.status === "REVISION_REQUESTED",
  );
  const refusedPosts = posts.filter((p) => p.status === "REJECTED");
  const kanbanColumns = [
    { key: "PENDING_APPROVAL", title: "Aguardando aprovação" },
    { key: "REVISION_REQUESTED", title: "Aguardando correção" },
    { key: "APPROVED", title: "Aprovado / Postado" },
    { key: "ARCHIVED", title: "Arquivado" },
    { key: "REJECTED", title: "Recusado" },
  ];
  const postsByStatus = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        if (post.status === "PENDING_APPROVAL") {
          acc.PENDING_APPROVAL.push(post);
        } else if (post.status === "REVISION_REQUESTED") {
          acc.REVISION_REQUESTED.push(post);
        } else if (
          ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(post.status)
        ) {
          acc.APPROVED.push(post);
        } else if (post.status === "ARCHIVED") {
          acc.ARCHIVED.push(post);
        } else if (post.status === "REJECTED") {
          acc.REJECTED.push(post);
        }
        return acc;
      },
      {
        PENDING_APPROVAL: [],
        REVISION_REQUESTED: [],
        APPROVED: [],
        ARCHIVED: [],
        REJECTED: [],
      },
    );
  }, [posts]);

  const totalMetrics = metrics.reduce(
    (acc, m) => {
      const name = (m.name || "").toLowerCase();
      const val = typeof m.value === "number" ? m.value : 0;

      if (name.includes("impression")) acc.impressions += val;
      if (name.includes("click")) acc.clicks += val;
      if (name.includes("spend") || name.includes("cost")) acc.spend += val;
      return acc;
    },
    { impressions: 0, clicks: 0, spend: 0 }
  );

  const isLoadingAny =
    loadingMe || loadingPosts || loadingMetrics || loadingApprovals;

  const recentPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return d2 - d1;
    });
    return sorted.slice(0, 4);
  }, [posts]);

  const handleApproveAction = useCallback(
    async (approvalId) => {
      if (!approvalId) return;
      await approveClientApproval(approvalId, {});
      refreshPortalData();
    },
    [approveClientApproval, refreshPortalData],
  );

  const handleRejectAction = useCallback(
    async (approvalId, defaultMessage = "Post recusado pelo cliente") => {
      if (!approvalId) return;
      const reason =
        typeof window !== "undefined"
          ? window.prompt("Conte brevemente o motivo:", defaultMessage) ||
            defaultMessage
          : defaultMessage;
      await rejectClientApproval(approvalId, { notes: reason });
      refreshPortalData();
    },
    [rejectClientApproval, refreshPortalData],
  );

  const handleRequestChanges = useCallback(
    async (approvalId) => {
      if (!approvalId) return;
      const notes =
        typeof window !== "undefined"
          ? window.prompt(
              "Descreva os ajustes desejados:",
              "Preciso ajustar o texto ou arte deste post.",
            ) || "Cliente solicitou ajustes"
          : "Cliente solicitou ajustes";
      await rejectClientApproval(approvalId, {
        notes,
        type: "REVISION_REQUESTED",
      });
      refreshPortalData();
    },
    [rejectClientApproval, refreshPortalData],
  );

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro de autenticação
          </h2>
          <p className="text-sm text-gray-600 mb-4">{authError}</p>
          <Button onClick={() => navigate("/clientlogin")}>
            Voltar para login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingAny && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Carregando portal...
          </h2>
          <p className="text-sm text-gray-600">
            Buscando suas informações e posts.
          </p>
        </div>
      </div>
    );
  }

  const kanbanEmpty = Object.values(postsByStatus).every(
    (list) => list.length === 0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoHeader}
              alt="Kondor"
              className="h-10 w-auto"
            />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Portal do cliente
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                {client?.metadata?.agency_name || "Kondor Studio"}
              </h1>
              {client?.name && (
                <p className="text-sm text-slate-500">
                  Conta: {client.name}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("kondor_client_auth");
                window.localStorage.removeItem("kondor_client_token");
              }
              navigate("/clientlogin");
            }}
          >
            Sair
          </Button>
        </div>
        <div className="border-t border-slate-100">
          <nav className="max-w-6xl mx-auto flex gap-2 px-4 py-3 text-sm">
            {[
              { key: "posts", label: "Posts" },
              { key: "metrics", label: "Métricas" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePage(item.key)}
                className={[
                  "rounded-full px-4 py-2 font-medium transition-all",
                  activePage === item.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {activePage === "posts" ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                title="Posts aguardando aprovação"
                value={pendingPosts.length}
                description="Revise e aprove rapidamente"
              />
              <SummaryCard
                icon={<Clock className="h-5 w-5 text-amber-500" />}
                title="Aguardando correção"
                value={awaitingCorrection.length}
                description="Posts com ajustes solicitados"
              />
              <SummaryCard
                icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
                title="Aprovados / Postados"
                value={approvedPosts.length}
                description="Últimos conteúdos liberados"
              />
              <SummaryCard
                icon={<LayoutGrid className="h-5 w-5 text-slate-500" />}
                title="Total no pipeline"
                value={posts.length}
                description="Visão geral do calendário"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <Card className="shadow-sm border border-slate-100 bg-white/90 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-600">
                    Alertas rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AlertItem
                    label="Posts aguardando sua aprovação"
                    value={`${pendingPosts.length} itens`}
                    accent="bg-orange-100 text-orange-700"
                  />
                  <AlertItem
                    label="Correções pendentes"
                    value={`${awaitingCorrection.length} itens`}
                    accent="bg-amber-100 text-amber-700"
                  />
                  <AlertItem
                    label="Posts recusados recentemente"
                    value={`${refusedPosts.length} itens`}
                    accent="bg-rose-100 text-rose-700"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-slate-100 bg-white/90 backdrop-blur lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-600">
                    Mini dashboard de métricas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricPill
                      label="Impressões"
                      value={totalMetrics.impressions.toLocaleString("pt-BR")}
                    />
                    <MetricPill
                      label="Cliques"
                      value={totalMetrics.clicks.toLocaleString("pt-BR")}
                    />
                    <MetricPill
                      label="Investimento"
                      value={`R$ ${totalMetrics.spend.toFixed(2)}`}
                    />
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Dados consolidados das plataformas conectadas.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Últimos posts
                  </h2>
                  <p className="text-sm text-slate-500">
                    Atalhos rápidos para aprovar ou solicitar ajustes
                  </p>
                </div>
              </div>
              <Card className="shadow-sm border border-slate-100 bg-white/90 backdrop-blur">
                <CardContent className="space-y-4 pt-6">
                  {recentPosts.length === 0 ? (
                    <EmptyState message="Nenhum post disponível por enquanto." />
                  ) : (
                    recentPosts.map((post) => {
                      const approval = approvalsByPostId.get(post.id);
                      const mediaUrl = resolveMediaUrl(
                        post.media_url || post.mediaUrl || "",
                      );
                      const platform =
                        post.platform ||
                        post.channel ||
                        post.socialNetwork ||
                        "Social";
                      return (
                        <article
                          key={post.id}
                          className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            {mediaUrl ? (
                              <img
                                src={mediaUrl}
                                alt={post.title || "Prévia do post"}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                {platform.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {post.title || post.caption || "Post sem título"}
                              </p>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                {platform}
                              </p>
                              <p className="text-xs text-slate-500">
                                Status atual:{" "}
                                <span className="font-medium text-slate-800">
                                  {post.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                mediaUrl && window.open(mediaUrl, "_blank")
                              }
                            >
                              Ver mídia
                            </Button>
                            <Button
                              size="sm"
                              disabled={!approval}
                              onClick={() =>
                                approval && handleApproveAction(approval.id)
                              }
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!approval}
                              onClick={() =>
                                approval && handleRequestChanges(approval.id)
                              }
                            >
                              Solicitar ajuste
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:text-rose-700"
                              disabled={!approval}
                              onClick={() =>
                                approval && handleRejectAction(approval.id)
                              }
                            >
                              Recusar
                            </Button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Pipeline de posts
                  </h2>
                  <p className="text-sm text-slate-500">
                    Fluxo visual de aprovação exclusivo para clientes
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-full">
                  {kanbanColumns.map((column) => (
                    <KanbanColumn
                      key={column.key}
                      title={column.title}
                      posts={postsByStatus[column.key]}
                      approvalsByPostId={approvalsByPostId}
                      onApprove={handleApproveAction}
                      onReject={handleRejectAction}
                      onRequestChanges={handleRequestChanges}
                    />
                  ))}
                </div>
                {kanbanEmpty && (
                  <div className="mt-6">
                    <EmptyState message="Ainda não há posts nesse pipeline. Assim que sua agência enviar conteúdos eles aparecerão aqui." />
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Métricas por plataforma
              </h2>
              <p className="text-sm text-slate-500">
                Tenha visão clara de cada canal com um clique.
              </p>
            </div>
            <Card className="shadow-sm border border-slate-100 bg-white/90 backdrop-blur">
              <CardContent className="pt-6">
                <MetricsTabs metrics={metrics} />
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, title, value, description }) {
  return (
    <Card className="shadow-sm border border-slate-100 bg-white/90 backdrop-blur">
      <CardContent className="flex flex-col gap-2 pt-6">
        <div className="flex items-center gap-2 text-slate-500">{icon}</div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function AlertItem({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
        {value}
      </span>
    </div>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function KanbanColumn({
  title,
  posts,
  approvalsByPostId,
  onApprove,
  onRequestChanges,
  onReject,
}) {
  return (
    <div className="min-w-[240px] flex-1 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <span className="text-xs text-slate-400">{posts.length}</span>
      </div>
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
            Sem itens
          </div>
        ) : (
          posts.map((post) => {
            const approval = approvalsByPostId.get(post.id);
            const mediaUrl = resolveMediaUrl(post.media_url || post.mediaUrl || "");
            const platform =
              post.platform || post.channel || post.socialNetwork || "Social";
            return (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={post.title || "Prévia"}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                      {platform.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {post.title || post.caption || "Post sem título"}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {platform}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => mediaUrl && window.open(mediaUrl, "_blank")}
                  >
                    Ver
                  </Button>
                  <Button
                    size="xs"
                    disabled={!approval}
                    onClick={() => approval && onApprove(approval.id)}
                  >
                    <ThumbsUp className="mr-1 h-3 w-3" />
                    Aprovar
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={!approval}
                    onClick={() => approval && onRequestChanges(approval.id)}
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    Ajuste
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700"
                    disabled={!approval}
                    onClick={() => approval && onReject(approval.id)}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Recusar
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function MetricsTabs({ metrics }) {
  const tabs = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "google", label: "Google" },
    { key: "tiktok", label: "TikTok" },
  ];

  const getStatsForPlatform = useCallback(
    (platformKey) => {
      const normalized = platformKey.toLowerCase();
      const filtered = (metrics || []).filter((metric) => {
        const source =
          metric.platform ||
          metric.source ||
          metric.channel ||
          metric.campaignName ||
          "";
        return source.toLowerCase().includes(normalized);
      });

      if (filtered.length === 0) return null;

      return filtered.reduce(
        (acc, metric) => {
          const name = (metric.name || "").toLowerCase();
          const value = typeof metric.value === "number" ? metric.value : 0;
          if (name.includes("impression")) acc.impressions += value;
          else if (name.includes("click")) acc.clicks += value;
          else if (name.includes("conversion")) acc.conversions += value;
          else if (name.includes("spend") || name.includes("cost"))
            acc.spend += value;
          return acc;
        },
        { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
      );
    },
    [metrics],
  );

  return (
    <Tabs defaultValue="instagram" className="space-y-4">
      <TabsList className="bg-slate-100/80">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => {
        const stats = getStatsForPlatform(tab.key);
        return (
          <TabsContent key={tab.key} value={tab.key}>
            {stats ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricPill
                  label="Impressões"
                  value={stats.impressions.toLocaleString("pt-BR")}
                />
                <MetricPill
                  label="Cliques"
                  value={stats.clicks.toLocaleString("pt-BR")}
                />
                <MetricPill
                  label="Conversões"
                  value={stats.conversions.toLocaleString("pt-BR")}
                />
                <MetricPill
                  label="Investimento"
                  value={`R$ ${stats.spend.toFixed(2)}`}
                />
              </div>
            ) : (
              <EmptyState message="Sem dados para este canal ainda. Assim que conectarmos a conta, os números aparecem aqui." />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center text-sm text-slate-400">
      <BarChart3 className="mb-3 h-8 w-8 text-slate-300" />
      {message}
    </div>
  );
}
