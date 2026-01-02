import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import PageShell from "@/components/ui/page-shell.jsx";
import PageHeader from "@/components/ui/page-header.jsx";
import {
  Activity,
  Users,
  FileText,
  CheckSquare,
  Clock,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const {
    data: clients = [],
    isLoading: loadingClients,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const {
    data: posts = [],
    isLoading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list(),
  });

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const {
    data: team = [],
    isLoading: loadingTeam,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ["team"],
    queryFn: () => base44.entities.TeamMember.list("-created_date"),
  });

  const isLoading = loadingClients || loadingPosts || loadingTasks || loadingTeam;

  const totalClients = clients.length;
  const totalPosts = posts.length;
  const totalTasks = tasks.length;
  const totalTeam = team.length;

  const tasksTodo = tasks.filter((t) => t.status === "TODO").length;
  const tasksInProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const tasksDone = tasks.filter((t) => t.status === "DONE").length;

  const postsDraft = posts.filter((p) => p.status === "DRAFT").length;
  const postsScheduled = posts.filter((p) => p.status === "SCHEDULED").length;
  const postsPublished = posts.filter((p) => p.status === "PUBLISHED").length;

  const handleGlobalRefresh = () => {
    refetchClients();
    refetchPosts();
    refetchTasks();
    refetchTeam();
  };

  return (
    <PageShell>
      <PageHeader
        title="Visão geral"
        subtitle="Acompanhe rapidamente o desempenho da sua agência."
        actions={
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-xs"
              >
                <Clock className="w-3 h-3" />
                Atualizando dados...
              </Badge>
            ) : null}
            <Button
              variant="secondary"
              leftIcon={RefreshCw}
              onClick={handleGlobalRefresh}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clientes
              </CardTitle>
              <Users className="w-5 h-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? "—" : totalClients}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total de clientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Posts
              </CardTitle>
              <FileText className="w-5 h-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? "—" : totalPosts}
              </p>
              <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-600">
                <span>Rascunhos: {postsDraft}</span>
                <span>• Agendados: {postsScheduled}</span>
                <span>• Publicados: {postsPublished}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tarefas
              </CardTitle>
              <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? "—" : totalTasks}
              </p>
              <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-600">
                <span>Todo: {tasksTodo}</span>
                <span>• Em andamento: {tasksInProgress}</span>
                <span>• Concluídas: {tasksDone}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Equipe
              </CardTitle>
              <Activity className="w-5 h-5 text-[var(--primary)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? "—" : totalTeam}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Membros ativos na sua agência
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                Próximos passos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                • Cadastre clientes, tarefas e posts para acompanhar o fluxo de
                trabalho da sua agência.
              </p>
              <p>
                • Use o menu lateral para navegar entre Clientes, Posts,
                Tarefas, Biblioteca e Equipe.
              </p>
              <p>
                • Em breve, esta área poderá mostrar gráficos e métricas
                detalhadas.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                Atividade recente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">
              <p>
                Esta seção pode ser integrada com o histórico de aprovações,
                posts e tarefas para mostrar o que está acontecendo em tempo
                real.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
