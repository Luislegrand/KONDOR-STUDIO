// front/src/pages/admin/AdminTenants.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/apiClient/base44Client";
import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Building2, Search, Loader2 } from "lucide-react";

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "CANCELLED", label: "Cancelado" },
];

const PAGE_SIZE = 10;

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

export default function AdminTenants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const queryKey = useMemo(
    () => ["admin-tenants", { search, status, page }],
    [search, status, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      base44.admin.tenants({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      }),
    keepPreviousData: true,
  });

  const tenants = data?.tenants || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: tenants.length };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
  };

  const navigateToTenant = (tenantId) => {
    navigate(`/admin/tenants/${tenantId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Tenants
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Listagem geral</h1>
        <p className="text-gray-600">
          Monitore status, planos e contatos primários das agências.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSearch}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Busca por nome ou slug
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tenant..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Status
            </label>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" className="px-6">
              Aplicar filtros
            </Button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Contato
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Plano
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Criado em
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      {tenant.name}
                    </div>
                    <p className="text-xs text-gray-500">{tenant.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {tenant.primaryContact?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tenant.primaryContact?.email || "Sem contato"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.plan?.name || "—"}
                    {tenant.plan?.key && (
                      <p className="text-xs text-gray-500">{tenant.plan.key}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="text-xs">
                      {tenant.statusLabel || tenant.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(tenant.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigateToTenant(tenant.id)}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum tenant encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin w-4 h-4" />
            Atualizando lista...
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-sm text-gray-600">
          <div>
            Página {pagination.page} de {pagination.totalPages || 1} — {" "}
            {pagination.total} tenants
          </div>
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
