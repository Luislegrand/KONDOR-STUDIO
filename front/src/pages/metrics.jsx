import React, { useState } from "react";
import { base44 } from "@/apiClient/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
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

export default function Metrics() {
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics", selectedClient, selectedPlatform],
    queryFn: () => {
      let query = {};
      if (selectedClient !== "all") query.client_id = selectedClient;
      if (selectedPlatform !== "all") query.platform = selectedPlatform;
      return base44.entities.Metric.filter(query, "-date", 30);
    },
  });

  // Calcular totais
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      clicks: acc.clicks + (m.clicks || 0),
      conversions: acc.conversions + (m.conversions || 0),
      spend: acc.spend + (m.spend || 0),
      revenue: acc.revenue + (m.revenue || 0),
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  );

  const avgCtr =
    totals.impressions > 0
      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
      : 0;
  const avgCpc =
    totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0;
  const roas =
    totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : 0;

  // Dados para gráfico
  const chartData = metrics
    .slice(0, 14)
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      conversions: m.conversions || 0,
      spend: m.spend || 0,
    }));

  const stats = [
    {
      title: "Total Gasto",
      value: `R$ ${totals.spend.toFixed(2)}`,
      icon: DollarSign,
      color: "from-purple-400 to-purple-500",
      trend: "+12%",
    },
    {
      title: "Impressões",
      value: totals.impressions.toLocaleString(),
      icon: Eye,
      color: "from-blue-400 to-blue-500",
    },
    {
      title: "Cliques",
      value: totals.clicks.toLocaleString(),
      icon: MousePointerClick,
      color: "from-green-400 to-green-500",
    },
    {
      title: "Conversões",
      value: totals.conversions.toLocaleString(),
      icon: Target,
      color: "from-orange-400 to-orange-500",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Métricas</h1>
          <p className="text-gray-600">
            Acompanhe o desempenho das campanhas
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPlatform}
            onValueChange={setSelectedPlatform}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as plataformas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as plataformas</SelectItem>
              <SelectItem value="META">Meta Ads</SelectItem>
              <SelectItem value="GOOGLE">Google Ads</SelectItem>
              <SelectItem value="TIKTOK">TikTok Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
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
                  {stat.trend && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend} vs. período anterior
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <Card className="border border-purple-100">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Impressões x Cliques (últimos 14 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                      name="Impressões"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      name="Cliques"
                    />
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
                Investimento x Conversões
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="spend"
                      fill="#A855F7"
                      name="Investimento"
                    />
                    <Bar
                      dataKey="conversions"
                      fill="#22C55E"
                      name="Conversões"
                    />
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

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">CTR Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-900">
                {avgCtr}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">CPC Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-900">
                R$ {avgCpc}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-900">
                {roas}x
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        {metrics.length === 0 && (
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
    </div>
  );
}
