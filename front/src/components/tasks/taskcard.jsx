import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Pencil, Trash2, CalendarDays } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "TODO", label: "A fazer" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "REVIEW", label: "Revisão" },
  { value: "DONE", label: "Concluída" },
  { value: "BLOCKED", label: "Bloqueada" },
];

function formatStatusLabel(value) {
  const found = STATUS_OPTIONS.find((s) => s.value === value);
  return found ? found.label : value;
}

function formatDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function Taskcard({
  task,
  client,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);

  const handleStatusChange = (newStatus) => {
    if (!onStatusChange) return;
    onStatusChange(task.id, newStatus);
    setStatusMenuOpen(false);
  };

  useEffect(() => {
    function handleOutside(event) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusMenuOpen(false);
      }
    }
    if (statusMenuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [statusMenuOpen]);

  const dueLabel = formatDate(task.dueDate);

  return (
    <Card className="border border-transparent bg-white/95 shadow-lg shadow-purple-50 rounded-2xl hover:-translate-y-0.5 transition transform">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2">
              {task.title || "Tarefa sem título"}
            </CardTitle>
            {client && (
              <p className="text-[11px] text-gray-500 mt-1">{client.name}</p>
            )}
          </div>
          <Badge className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100">
            {formatStatusLabel(task.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        {task.description ? (
          <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line">
            {task.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Sem descrição</p>
        )}

        {dueLabel && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-3 bg-gray-50 rounded-lg px-2 py-1 w-fit">
            <CalendarDays className="w-3 h-3" />
            <span>Prazo {dueLabel}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 flex flex-col gap-3">
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-medium text-purple-700 shadow-sm hover:border-purple-300 flex items-center justify-between"
            onClick={() => setStatusMenuOpen((prev) => !prev)}
          >
            <span>{formatStatusLabel(task.status)}</span>
            <span className="text-[10px] text-gray-400">Alterar</span>
          </button>
          {statusMenuOpen && (
            <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-100 bg-white shadow-2xl">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-50 ${
                    task.status === opt.value
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700"
                  }`}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between w-full">
          <Button
            variant="outline"
            className="flex-1 border-purple-200 hover:bg-purple-50 text-sm"
            onClick={() => onEdit && onEdit(task)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm"
            onClick={() => onDelete && onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
