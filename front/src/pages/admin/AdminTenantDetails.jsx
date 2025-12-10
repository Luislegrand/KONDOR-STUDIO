// front/src/pages/admin/AdminTenantDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.jsx";
import { ArrowLeft, Loader2 } from "lucide-react";

const statusOptions = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "CANCELLED", label: "Cancelado" },
];

const severityOptions = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
];

const NOTE_FORM_DEFAULT = { title: "", body: "", severity: "MEDIUM" };

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTenantDetails() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusValue, setStatusValue] = useState("TRIAL");
  const [planKey, setPlanKey] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [noteForm, setNoteForm] = useState(NOTE_FORM_DEFAULT);
  const [noteFeedback, setNoteFeedback] = useState(null);
  const [tab, setTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenant", tenantId],
    queryFn: () => base44.admin.tenant(tenantId),
    enabled: Boolean(tenantId),
  });

  const tenant = data?.tenant;

  useEffect(() => {
    if (tenant) {
      setStatusValue(tenant.status || "TRIAL");
      setPlanKey(tenant.plan?.key || "");
    }
  }, [tenant]);

  const { data: notesData, isLoading: loadingNotes } = useQuery({
    queryKey: ["admin-tenant-notes", tenantId],
    queryFn: () => base44.admin.tenantNotes(tenantId),
    enabled: Boolean(tenantId),
  });

  const notes = notesData?.notes || [];

  const mutation = useMutation({
    mutationFn: (payload) => base44.admin.updateTenant(tenantId, payload),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Tenant atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["admin-tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error?.data?.error || "Falha ao atualizar tenant.",
      });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (payload) => base44.admin.createTenantNote(tenantId, payload),
    onSuccess: () => {
      setNoteFeedback({ type: "success", message: "Nota registrada." });
      setNoteForm(NOTE_FORM_DEFAULT);
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-notes", tenantId] });
    },
    onError: (error) => {
      setNoteFeedback({
        type: "error",
        message: error?.data?.error || "Falha ao registrar nota.",
      });
    },
  });

  const stats = useMemo(() => {
    const counts = tenant?._count || tenant?.counts || {};
    return [
      { label: "Usuários", value: counts.users ?? 0 },
      { label: "Clientes", value: counts.clients ?? 0 },
      { label: "Projetos", value: counts.projects ?? 0 },
      { label: "Posts", value: counts.posts ?? 0 },
    ];
  }, [tenant]);

  const handleUpdateTenant = (event) => {
    event.preventDefault();
    if (!tenant) return;
    const payload = {};
    if (statusValue && statusValue !== tenant.status) {
      payload.status = statusValue;
    }
    if (planKey && planKey !== (tenant.plan?.key || "")) {
      payload.planKey = planKey;
    }
    if (!Object.keys(payload).length) {
      setFeedback({ type: "info", message: "Nenhuma alteração para salvar." });
      return;
    }
    mutation.mutate(payload);
  };

  const handleNoteSubmit = (event) => {
    event.preventDefault();
    if (!noteForm.title || !noteForm.body) {
      setNoteFeedback({ type: "error", message: "Título e descrição são obrigatórios." });
      return;
    }
    noteMutation.mutate(noteForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando tenant...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-sm text-gray-500">
        Tenant não encontrado.
        {" "}
        <button onClick={() => navigate(-1)} className="text-purple-600">
          Voltar
        </button>
      </div>
    );
  }

  const subscription = tenant.subscription;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Detalhes do tenant
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
        <p className="text-gray-600">Slug: {tenant.slug}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="notes">Notas de suporte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="border border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{tenant.statusLabel || tenant.status}</Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Criado em {formatDate(tenant.createdAt)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Atualizar tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleUpdateTenant}>
                  <div className="space-y-1 text-sm">
                    <label className="font-medium text-gray-700">Status</label>
                    <Select value={statusValue} onValueChange={setStatusValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 text-sm">
                    <label className="font-medium text-gray-700">Plano (key)</label>
                    <Input
                      value={planKey}
                      onChange={(e) => setPlanKey(e.target.value)}
                      placeholder="ex: pro_monthly"
                    />
                    <p className="text-xs text-gray-500">
                      Informe a chave interna do plano que será atribuída.
                    </p>
                  </div>

                  {feedback && (
                    <div
                      className={
                        "text-sm " +
                        (feedback.type === "success"
                          ? "text-emerald-600"
                          : feedback.type === "error"
                          ? "text-red-600"
                          : "text-gray-600")
                      }
                    >
                      {feedback.message}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={mutation.isLoading}>
                      {mutation.isLoading ? "Salvando..." : "Salvar alterações"}
                    </Button>
                    <span className="text-xs text-gray-500">
                      Última atualização: {formatDate(tenant.updatedAt)}
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Contato & assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Contato principal
                  </p>
                  {tenant.primaryContact ? (
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {tenant.primaryContact.name}
                      </p>
                      <p>{tenant.primaryContact.email}</p>
                      <p className="text-xs text-gray-500">
                        {tenant.primaryContact.role}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Sem contato definido.</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Plano atual
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {tenant.plan?.name || "Sem plano"}
                  </p>
                  {subscription && (
                    <p className="text-xs text-gray-500">
                      Status: {subscription.status} | Próximo ciclo: {" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Registrar nova nota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleNoteSubmit}>
                  <div className="space-y-1 text-sm">
                    <label className="font-medium text-gray-700">Título</label>
                    <Input
                      value={noteForm.title}
                      onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Contato com suporte"
                    />
                  </div>

                  <div className="space-y-1 text-sm">
                    <label className="font-medium text-gray-700">Severidade</label>
                    <Select
                      value={noteForm.severity}
                      onValueChange={(value) => setNoteForm((prev) => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {severityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 text-sm">
                    <label className="font-medium text-gray-700">Descrição</label>
                    <Textarea
                      rows={5}
                      value={noteForm.body}
                      onChange={(e) => setNoteForm((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder="Detalhe o histórico ou o pedido do cliente..."
                    />
                  </div>

                  {noteFeedback && (
                    <div
                      className={
                        "text-sm " +
                        (noteFeedback.type === "success"
                          ? "text-emerald-600"
                          : noteFeedback.type === "error"
                          ? "text-red-600"
                          : "text-gray-600")
                      }
                    >
                      {noteFeedback.message}
                    </div>
                  )}

                  <Button type="submit" disabled={noteMutation.isLoading}>
                    {noteMutation.isLoading ? "Registrando..." : "Salvar nota"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Histórico de notas
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {loadingNotes ? "Carregando" : `${notes.length} registro(s)`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingNotes && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando notas...
                  </div>
                )}
                {!loadingNotes && notes.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma nota registrada.</p>
                )}
                {!loadingNotes && notes.map((note) => (
                  <div key={note.id} className="border border-gray-100 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {note.title}
                      </p>
                      <Badge
                        variant={note.severity === "HIGH" ? "danger" : note.severity === "LOW" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {note.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {note.author?.name || note.author?.email || "Sistema"} — {formatDateTime(note.createdAt)}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.body}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
