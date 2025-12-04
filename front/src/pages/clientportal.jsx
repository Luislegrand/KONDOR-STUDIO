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
import { FileText, CheckCircle, FileDown, Eye } from "lucide-react";

+ import Navbar from "@/components/navbar.jsx";
import Postapprovalcard from "../components/portal/postapprovalcard.jsx";
import { base44 } from "../base44Client";

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
    data: reportsData,
    isLoading: loadingReports,
  } = useQuery({
    queryKey: ["client-portal", "reports"],
    enabled: queriesEnabled,
    queryFn: () => fetchClient("/client-portal/reports", clientToken),
  });

  const reports = reportsData?.items || [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        tenant={{
          name: client?.metadata?.agency_name || "Portal do Cliente",
          logo: client?.metadata?.agency_logo || null,
          primary: primaryColor,
          accent: accentColor,
        }}
        clientName={client?.name}
        onLogout={() => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("kondor_client_auth");
            window.localStorage.removeItem("kondor_client_token");
          }
          navigate("/clientlogin");
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Posts pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-gray-900">
                {pendingPosts.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Posts aprovados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-gray-900">
                {approvedPosts.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Métricas recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-700 space-y-1">
                <p>Impressões: {totalMetrics.impressions}</p>
                <p>Cliques: {totalMetrics.clicks}</p>
                <p>Investimento: R$ {totalMetrics.spend.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approval" className="w-full">
          <TabsList className="mb-4">
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
                      accentColor={accentColor}
                      token={clientToken}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedPosts.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Ainda não há posts aprovados ou publicados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {approvedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.title || post.caption || "Post sem título"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Status:{" "}
                            <span className="font-semibold">
                              {post.status}
                            </span>
                          </p>
                        </div>

                        {post.mediaUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(post.mediaUrl, "_blank")}
                          >
                            Ver mídia
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
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
                        className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {report.title || "Relatório"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Gerado em{" "}
                            {new Date(report.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {report.pdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(report.pdfUrl, "_blank")}
                          >
                            Baixar PDF
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
