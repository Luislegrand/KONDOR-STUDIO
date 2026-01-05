// front/src/pages/admin/AdminLogs.jsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { Input } from "@/components/ui/input.jsx";
import { DateField } from "@/components/ui/date-field.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Search, Loader2 } from "lucide-react";

const PAGE_SIZE = 20;
const levelOptions = [
  { value: "", label: "Todos" },
  { value: "ERROR", label: "Erro" },
  { value: "WARN", label: "Aviso" },
  { value: "INFO", label: "Info" },
];

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

export default function AdminLogs() {
  const [filters, setFilters] = useState({
    search: "",
    level: "",
    source: "",
    tenantId: "",
    since: "",
  });
  const [page, setPage] = useState(1);

  const queryKey = useMemo(
    () => ["admin-logs", { ...filters, page }],
    [filters, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      base44.admin.logs({
        page,
        pageSize: PAGE_SIZE,
        search: filters.search || undefined,
        level: filters.level || undefined,
        source: filters.source || undefined,
        tenantId: filters.tenantId || undefined,
        since: filters.since || undefined,
      }),
    keepPreviousData: true,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: logs.length };

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-gray-500">Logs da plataforma</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Eventos e erros recentes</h1>
        <p className="text-gray-600 mt-1">
          Monitore ocorrências registradas pelo middleware global e pelos workers.
        </p>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Buscar por mensagem
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleChange("search", e.target.value)}
                  placeholder="Erro, endpoint..."
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Fonte</label>
              <Input
                value={filters.source}
                onChange={(e) => handleChange("source", e.target.value)}
                placeholder="API, WORKER..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Nível</label>
              <Select value={filters.level} onValueChange={(val) => handleChange("level", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Tenant ID</label>
              <Input
                value={filters.tenantId}
                onChange={(e) => handleChange("tenantId", e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Desde</label>
              <DateField
                value={filters.since}
                onChange={(e) => handleChange("since", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="px-6">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Mensagem</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fonte</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tenant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-gray-900">{log.message}</p>
                      {log.metadata?.url && (
                        <p className="text-xs text-gray-500">
                          {log.metadata.method} {log.metadata.url}
                        </p>
                      )}
                      {log.stack && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {log.stack}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="text-xs mr-2">{log.source}</Badge>
                    <Badge
                      variant={log.level === "ERROR" ? "danger" : log.level === "WARN" ? "warning" : "outline"}
                      className="text-xs mt-1"
                    >
                      {log.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.tenantName || log.tenantId || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhum log encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Atualizando logs...
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 text-sm text-gray-600 border-t border-gray-100">
          <span>
            Página {pagination.page} de {pagination.totalPages || 1} — {pagination.total} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, pagination.totalPages || prev + 1))
              }
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
