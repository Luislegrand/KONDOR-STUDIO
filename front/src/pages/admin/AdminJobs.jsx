// front/src/pages/admin/AdminJobs.jsx
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
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 20;
const statusOptions = [
  { value: "FAILED", label: "Falhados" },
  { value: "RETRYING", label: "Reprocessando" },
  { value: "COMPLETED", label: "Concluídos" },
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

export default function AdminJobs() {
  const [filters, setFilters] = useState({
    queue: "",
    status: "FAILED",
    tenantId: "",
    search: "",
    since: "",
  });
  const [page, setPage] = useState(1);

  const queryKey = useMemo(
    () => ["admin-jobs", { ...filters, page }],
    [filters, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      base44.admin.jobs({
        page,
        pageSize: PAGE_SIZE,
        queue: filters.queue || undefined,
        status: filters.status || undefined,
        tenantId: filters.tenantId || undefined,
        search: filters.search || undefined,
        since: filters.since || undefined,
      }),
    keepPreviousData: true,
  });

  const jobs = data?.jobs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: jobs.length };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      queue: "",
      status: "FAILED",
      tenantId: "",
      search: "",
      since: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-gray-500">Jobs e filas</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Monitoramento de workers</h1>
        <p className="text-gray-600 mt-1">
          Acompanhe jobs com falha e filas mais críticas do BullMQ.
        </p>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Fila</label>
            <Input
              value={filters.queue}
              onChange={(e) => updateFilter("queue", e.target.value)}
              placeholder="ex: metricsSyncQueue"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
            <Select value={filters.status} onValueChange={(val) => updateFilter("status", val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
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
              onChange={(e) => updateFilter("tenantId", e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Buscar em erros</label>
            <Input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Mensagem parcial"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Desde</label>
            <DateField
              value={filters.since}
              onChange={(e) => updateFilter("since", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fila</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Erro</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tenant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tentativas</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {job.queue}
                      </Badge>
                      <Badge
                        variant={job.status === "FAILED" ? "danger" : job.status === "RETRYING" ? "warning" : "success"}
                        className="text-xs"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    {job.jobId && (
                      <p className="text-xs text-gray-500 mt-1">Job ID: {job.jobId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-800 line-clamp-3">
                      {job.error || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {job.tenantId || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {job.attempts ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(job.createdAt)}
                  </td>
                </tr>
              ))}
              {!isLoading && jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <p>Nenhum job encontrado com os filtros atuais.</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Atualizando jobs...
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
