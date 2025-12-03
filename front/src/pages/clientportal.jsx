import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import {
  FileText,
  CheckCircle,
  FileDown,
  Eye,
} from "lucide-react";

import Postapprovalcard from "../components/portal/postapprovalcard.jsx";

// Helper para chamadas com token de CLIENTE
async function fetchClient(path, token) {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg =
      data?.error ||
      (res.status === 401
        ? "Sessão expirada. Faça login novamente."
        : "Erro ao carregar dados do portal.");
    throw new Error(msg);
  }

  return res.json();
}

export default function Clientportal() {
  const navigate = useNavigate();
  const [clientToken, setClientToken] = useState(null);
  const [authError, setAuthError] = useState("");

  // Carrega token do cliente do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("kondor_client_token");
    if (!stored) {
      navigate("/clientlogin");
      return;
    }
    setClientToken(stored);
  }, [navigate]);

  // Se ainda não temos token carregado, não tenta bater API
  const queriesEnabled = !!clientToken;

  // === /api/client-portal/me ===
  const {
    data: meData,
    isLoading: loadingMe,
    error: meError,
  } = useQuery({
    queryKey: ["client-portal", "me"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/api/client-portal/me", clientToken),
  });

  useEffect(() => {
    if (meError) {
      console.error(meError);
      setAuthError(
        meError.message || "Erro ao carregar dados do cliente. Faça login novamente."
      );
    }
  }, [meError]);

  const client = meData?.client || null;

  // === /api/client-portal/posts ===
  const {
    data: postsData,
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ["client-portal", "posts"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/api/client-portal/posts", clientToken),
  });

  const posts = postsData?.items || [];

  // === /api/client-portal/metrics?days=7 ===
  const {
    data: metricsData,
    isLoading: loadingMetrics,
  } = useQuery({
    queryKey: ["client-portal", "metrics", 7],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/api/client-portal/metrics?days=7", clientToken),
  });

  const metrics = metricsData?.items || [];

  // === /api/client-portal/reports ===
  const {
    data: reportsData,
    isLoading: loadingReports,
  } = useQuery({
    queryKey: ["client-portal", "reports"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/api/client-portal/reports", clientToken),
  });

  const reports = reportsData?.items || [];

  // === /api/client-portal/approvals?status=PENDING ===
  const {
    data: approvalsData,
    isLoading: loadingApprovals,
  } = useQuery({
    queryKey: ["client-portal", "approvals", "PENDING"],
    enabled: queriesEnabled,
    queryFn: () =>
      fetchClient("/api/client-portal/approvals?status=PENDING", clientToken),
  });

  const approvals = approvalsData?.items || [];

  // Mapeia approval PENDING por postId
  const approvalsByPostId = useMemo(() => {
    const map = new Map();
    (approvals || []).forEach((approval) => {
      const postId = approval.postId || approval.post?.id;
      if (!postId) return;

      const existing = map.get(postId);
      if (!existing) {
        map.set(postId, approval);
        return;
      }

      const existingDate = existing.createdAt
        ? new Date(existing.createdAt).getTime()
        : 0;
      const newDate = approval.createdAt
        ? new Date(approval.createdAt).getTime()
        : 0;

      if (newDate > existingDate) {
        map.set(postId, approval);
      }
    });
    return map;
  }, [approvals]);

  // Posts que têm aprovação pendente
  const pendingPosts = posts.filter((p) => approvalsByPostId.has(p.id));

  // Posts aprovados/agendados/publicados
  const approvedPosts = posts.filter((p) =>
    ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(p.status)
  );

  // Agrega métricas básicas a partir de Metric.name / value
  const totalMetrics = metrics.reduce(
    (acc, m) => {
      const name = (m.name || "").toLowerCase();
      const value = typeof m.value === "number" ? m.value : 0;

      if (name.includes("impression")) acc.impressions += value;
      if (name.includes("click")) acc.clicks += value;
      if (name.includes("conversion")) acc.conversions += value;
      if (name.includes("spend") || name.includes("custo") || name.includes("invest"))
        acc.spend += value;

      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const primaryColor = "#A78BFA";
  const accentColor = "#39FF14";

  const loadingAny =
    loadingMe || loadingPosts || loadingMetrics || loadingReports || loadingApprovals;

  // Se der erro de auth ou não tiver token, força voltar pro login
  useEffect(() => {
    if (authError) {
      localStorage.removeItem("kondor_client_token");
      localStorage.removeItem("kondor_client_info");
      navigate("/clientlogin");
    }
  }, [authError, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-accent: ${accentColor};
        }
        .brand-bg {
          background-color: var(--brand-primary);
        }
        .brand-text {
          color: var(--brand-primary);
        }
        .brand-border {
          border-color: var(--brand-primary);
        }
      `}</style>

      {/* Header simples com nome do cliente */}
      <header className="brand-bg text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                <span
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {client?.name?.[0] || "C"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {client?.metadata?.agency_name || "Portal do Cliente"}
                </h1>
                <p className="text-white/80 text-sm">
                  Acompanhe suas aprovações, posts e relatórios
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{client?.name || "Cliente"}</p>
              <p className="text-white/80 text-sm">
                {client?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading geral */}
        {loadingAny && (
          <div className="mb-6 text-sm text-gray-600">
            Carregando informações do portal...
          </div>
        )}

        {/* Stats rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-t-4" style={{ borderTopColor: primaryColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Posts Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold brand-text">
                {pendingPosts.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4" style={{ borderTopColor: primaryColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Impressões (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold brand-text">
                {totalMetrics.impressions.toLocaleString("pt-BR")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4" style={{ borderTopColor: primaryColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Cliques (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold brand-text">
                {totalMetrics.clicks.toLocaleString("pt-BR")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4" style={{ borderTopColor: primaryColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold brand-text">
                {reports.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="approval" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="approval">
              <FileText className="w-4 h-4 mr-2" />
              Aprovações
            </TabsTrigger>
            <TabsTrigger value="library">
              <Eye className="w-4 h-4 mr-2" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileDown className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Aprovações */}
          <TabsContent value="approval" className="space-y-6">
            {pendingPosts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Tudo aprovado!
                  </h3>
                  <p className="text-gray-600">
                    Não há posts aguardando sua aprovação no momento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post) => {
                  const approval = approvalsByPostId.get(post.id) || null;

                  return (
                    <Postapprovalcard
                      key={post.id}
                      post={post}
                      approval={approval}
                      primaryColor={primaryColor}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Biblioteca */}
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Posts Aprovados e Publicados</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedPosts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum post na biblioteca ainda
                  </p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {approvedPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden">
                        {post.mediaUrl && (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-2">
                            {post.title}
                          </h4>
                          <Badge
                            className={
                              post.status === "PUBLISHED"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {post.status === "PUBLISHED"
                              ? "Publicado"
                              : post.status === "SCHEDULED"
                              ? "Agendado"
                              : "Aprovado"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-16">
                    <FileDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nenhum relatório disponível ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-semibold">
                            {report.name || "Relatório"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {report.generatedAt
                              ? new Date(report.generatedAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : new Date(report.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!report.fileId}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          {report.fileId ? "Baixar PDF" : "Em processamento"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
